const express = require('express');
const router = express.Router();
const path = require('path');
const { google } = require('googleapis');
const { customAlphabet } = require('nanoid');
const { sendOrderEmail } = require('../utils/mailer');
require('dotenv').config();

// 建立 Google Sheets API 認證物件
const auth = new google.auth.GoogleAuth({
    keyFilename:path.join(__dirname,'../config/cy-order-form-be56c183fd58.json'),
    scopes:['https://www.googleapis.com/auth/spreadsheets']
});

// 只允許大寫英文字母和數字
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateOrderId = customAlphabet(alphabet,8);

router.get('/', async(req, res) => {
    return res.render('order-form');
})

// post: 表單送出後儲存至 google sheets
router.post('/submit-order', async (req, res) => {
    console.log(req.body);

    const order = req.body; // 直接將 req.body 儲存在 order 變數內
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = '訂單總表';
    // 產生 order id
    const orderId = generateOrderId();

    try {
        // 1. 使用認證物件取得授權後的http客戶端
        const client = await auth.getClient();
        // 2. 初始化 google sheets api 客戶端
        const sheets = google.sheets({ version: 'v4', auth: client });

        // 3. 將商品資料變成 2D array, 每個子陣列對應一個 row
        //    將每筆商品填入完整的訂單資訊和當下時間
        const orderDate = new Date().toLocaleDateString('zh-TW', {hour12:false});
        const rows = (order.items || []).map(item => ([
            orderId || '',
            order.company     || '',       // 訂貨單位
            order.phone       || '',       // 手機號碼
            order.email       || '',       // Email
            order.address     || '',       // 地址
            order.invoiceTitle|| '',       // 發票抬頭
            order.taxId       || '',       // 統一編號
            order.number      || '',       // 商品編號
            item.name         || '',       // 單一商品名稱
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

        // 5. 將訂單資訊寄送給客戶 email
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
        await sendOrderEmail(order.email,subject,dynamicTemplateData);

        //  完成後渲染thank-you page
        res.redirect(`/thank-you?orderNumber=${orderId}&name=${encodeURIComponent(order.company)}`)
    } catch (error) {
        console.error('處理表單發生錯誤', error);
        res.status(500).json({
            success:false,
            message:'Server error, please try it later'
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


module.exports = router;