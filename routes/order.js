const express = require('express');
const router = express.Router();
const path = require('path');
const { google } = require('googleapis');
const { customAlphabet } = require('nanoid');
const { sendOrderEmail } = require('../utils/mailer');
if( process.env.NODE_ENV === 'development'){
  require('dotenv').config();
}

// 建立 Google Sheets API 認證物件
const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
const parsed = JSON.parse(raw);

// Fix private_key newlines
parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: parsed,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive'
    ]
});


// 只允許大寫英文字母和數字
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateOrderId = customAlphabet(alphabet,8);

router.get('/', async(req, res) => {
    return res.render('order-form');
})

// post: 表單送出後儲存至 google sheets
router.post('/submit-order', async (req, res) => {
    const order = req.body; // 直接將 req.body 儲存在 order 變數內

    // 產生 order id
    const orderId = generateOrderId();

    try {
        // 1. 使用認證物件取得授權後的http客戶端
        const client = await auth.getClient();
        // 2. 初始化 google sheets api 客戶端
        const sheets = google.sheets({ version: 'v4', auth: client });
        const drive = google.drive({version:'v3', auth:client});
        // initiate docs client
        const docs = google.docs({version:'v1', auth:client});
        // 3. 將商品資料變成 2D array, 每個子陣列對應一個 row
        //    將每筆商品填入完整的訂單資訊和當下時間
        const orderDate = new Date().toLocaleDateString('zh-TW', {hour12:false});
        // 將 order info 儲存在 google sheet
        await storeInSheet(sheets,order,orderId,orderDate);

        // 4. 將訂單資訊寄送給客戶 email
        // use sendgrid send email
        const subject = `您的訂單 ${orderId} 已送出`;
        const dynamicTemplateData = {
            company:order.company,
            orderId:orderId,
            orderDate:orderDate,
            paymentMethod:order.paymentMethod,
            items:order.items,
            totalAmount:order.totalAmount,
            notes:order.notes
        }

        //  完成後渲染thank-you page
        res.redirect(`/thank-you?orderNumber=${orderId}&name=${encodeURIComponent(order.company)}`)
        
        // send email
        await sendOrderEmail(order.email,subject,dynamicTemplateData);

        // 5. create new docs which stores order infomation
        // generate docs in drive folder and return docs id
        const docsId = await generateDocs(drive,order.company,orderId);
        await insertUserInfo(order,docsId,docs);
        await insertBlanckRows(docs,order.items,docsId);
        await insertOrderItems(docs,order,docsId);

        
    } catch (error) {
        console.error('處理表單發生錯誤', error);
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
});

router.get('/thank-you', async(req, res) => {
    const {orderNumber, name} = req.query;
    res.render('thank-you', {
        orderNumber,
        name
    })
})

const storeInSheet = async(sheets,order,orderId,orderDate) => {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = '訂單總表';
    const rows = (order.items || []).map(item => ([
            orderId || '',
            order.company     || '',       // 訂貨單位
            order.person      || '',       // 收貨人
            order.phone       || '',       // 手機號碼
            order.indoorPhone || '',       // 市內電話
            order.email       || '',       // Email
            order.address     || '',       // 地址
            order.invoiceTitle|| '',       // 發票抬頭
            order.taxId       || '',       // 統一編號
            item.number       || '',       // 商品編號
            item.name         || '',       // 單一商品名稱
            item.spec         || '',       // 商品規格
            item.quantity     || '',       // 該商品數量            
            item.price        || '',       // 該商品單價
            item.total        || '',       // 該商品小計
            order.totalAmount || '',       // 該訂單總金額
            order.paymentMethod|| '',      // 付款方式
            order.notes       || '',       // 備註
            // 使用 toLocaleString 產生台灣時區
            orderDate
    ]));

    // 4. 執行 append methd 將 rows 陣列新增至試算表的下一個可用列
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range:`${sheetName}!A1`,
        valueInputOption:'RAW',
        insertDataOption:'INSERT_ROWS',
        requestBody:{ values: rows}
    });

    console.log('訂單成功寫入 Google Sheets');
}
const generateDocs = async(drive,company,orderId) => {
    // copy docs template
    const copyDocs = await drive.files.copy({
        fileId:process.env.DOCS_ID,
        requestBody:{
            name:`訂單-${company}-${orderId}`,
            parents:[process.env.DEST_FOLDER_ID]
        }
    })

    return copyDocs.data.id;
}

const insertUserInfo = async(order,newDocsId,docs) => {
    // user information data
    const values = {
        company: order.company,
        Date: new Date().toLocaleDateString('zh-TW', {hour12:false}),
        invoiceTitle: order.invoiceTitle,
        phone: order.phone,
        taxId: order.taxId,
        indoorPhone: order.indoorPhone,
        person: order.person,
        email: order.email,
        address: order.address
    } 

    // 2. 置換 placeholder
    const requests_placeholder = Object.entries(values).map(([key,value]) => ({
        replaceAllText:{
            containsText:{
                text:`{{${key}}}`,
                matchCase:true,
            },
            replaceText:value
        }
    }));

    // insert user info
    await docs.documents.batchUpdate({
        documentId:newDocsId,
        requestBody:{
            requests:requests_placeholder
        }
    })
}

const insertBlanckRows = async (docs,items,newDocsId) => {
    // 再抓一次 docs
    const docsAfterReplace =  await docs.documents.get({documentId: newDocsId});
    const tables = docsAfterReplace.data.body.content.filter(e => e.table);
    const productTable = tables[1];
    
    // 3. 產生 requests：根據 items 數量插入新行，再填入資料
    const tableStart = productTable.startIndex; // 表格起始位置
    const requests = [];
    // 先插入足夠的空行（假設表頭已在第一行）
    items.forEach(() => {
        // 插入新行（插在表頭下方，每次都插在第2列）
        requests.push({
            insertTableRow: {
            tableCellLocation: {
                tableStartLocation: { index: tableStart },
                rowIndex: 0
            },
            insertBelow: true
            }
        });
    });
        
    // insert blank rows
    await docs.documents.batchUpdate({
        documentId: newDocsId,
        requestBody: { requests }
    });
}

const insertOrderItems = async (docs,order,newDocsId) => {
    // 4. 重新get docs table,(get the newest tableRows) 再填入文字
    const docsAfterBlank = await docs.documents.get({ documentId: newDocsId });
    const tablesAfterBlank = docsAfterBlank.data.body.content.filter(e => e.table);

    // 5. 選第2個table
    const tableEle = tablesAfterBlank[1];
    const tableStartAfterBlank = tableEle.table;

    // 6. 填入文字
    const fillCellRequests = [];
    let offset = 0;
    order.items.forEach((item,i) => {
        // 從第i+1列開始
        const row = tableStartAfterBlank.tableRows[i+1];
        console.log(row)
        // 一列有7欄, define 要傳入的 data
        const datas = [
            (i+1).toString(),
            item.number,
            item.name,
            item.spec,
            item.quantity.toString(),
            item.price.toString(),
            item.total.toString()
        ]

        datas.forEach((text, colIndex) => {
            const cell = row.tableCells[colIndex];
            // 直接用 cell.content[0].startIndex 做為插入點
            const cellStart = cell.content[0].startIndex;
            const insertIndex = cellStart + offset;

            // 先插入換行符號
            fillCellRequests.push({
                insertText:{
                    location:{index:insertIndex},
                    text:'\n'
                }
            });

            // 插入文字
            fillCellRequests.push({
                insertText:{
                    location:{index:insertIndex+1},
                    text
                }
            });

            offset += 1 + text.length;
            
        });
    });

    // insert totalAmount
    fillCellRequests.push({
        replaceAllText:{
            containsText:{
                text:`{{totalAmount}}`,
                matchCase:true
            },
            replaceText:order.totalAmount
        }
    })

    // insert note
    fillCellRequests.push({
        replaceAllText:{
            containsText:{
                text:`{{notes}}`,
                matchCase:true
            },
            replaceText:order.notes
        }
    })
    
    // 7. 執行填字
    await docs.documents.batchUpdate({
        documentId: newDocsId,
        requestBody: { requests: fillCellRequests }
    });
}

module.exports = router;