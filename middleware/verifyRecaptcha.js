const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
  const token = req.body['g-recaptcha-response'][0];
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  
  // ✅ 詳細記錄接收到的參數
  console.log('=== reCAPTCHA 驗證開始 ===');
  console.log('Token 類型:', typeof token);
  console.log('Token 值:', token);
  console.log('Token 長度:', token && typeof token === 'string' ? token.length : 'N/A');
  console.log('Token 前20字元:', token && typeof token === 'string' ? token.substring(0, 20) + '...' : 'N/A');
  console.log('Secret Key 是否存在:', !!secret);
  console.log('Secret Key 類型:', typeof secret);
  console.log('Secret Key 長度:', secret && typeof secret === 'string' ? secret.length : 'undefined');
  console.log('Client IP:', req.ip);
  console.log('User-Agent:', req.get('User-Agent'));
  
  if (!token || typeof token !== 'string') {
    console.log('❌ Token 無效 - 類型:', typeof token, '值:', token);
    return res.status(400).json({ message: '缺少或無效的 reCAPTCHA token' });
  }

  if (!secret) {
    console.log('❌ Secret Key 缺失');
    return res.status(500).json({ message: '服務器配置錯誤' });
  }

  try {
    // ✅ 修正：使用 form-urlencoded 格式
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    params.append('remoteip', req.ip);

    console.log('發送請求參數:', {
      secret: secret && typeof secret === 'string' ? secret.substring(0, 10) + '...' : secret,
      response: token && typeof token === 'string' ? token.substring(0, 20) + '...' : token,
      remoteip: req.ip
    });

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      params.toString(), // ✅ 使用正確的 form-urlencoded 格式
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // ✅ 添加超時設定
      }
    );

    // ✅ 詳細記錄 Google 的回應
    console.log('Google API 回應狀態:', response.status);
    console.log('Google API 回應完整內容:', JSON.stringify(response.data, null, 2));

    const { success, score, 'error-codes': errorCodes, action, hostname, challenge_ts } = response.data;

    // ✅ 分析回應內容
    console.log('驗證結果分析:');
    console.log('- success:', success);
    console.log('- score:', score);
    console.log('- error-codes:', errorCodes);
    console.log('- action:', action);
    console.log('- hostname:', hostname);
    console.log('- challenge_ts:', challenge_ts);

    if (!success) {
      console.log('❌ reCAPTCHA 驗證失敗');
      
      // ✅ 針對不同錯誤碼提供具體說明
      const errorMessages = {
        'missing-input-secret': 'Secret Key 缺失',
        'invalid-input-secret': 'Secret Key 無效',
        'missing-input-response': 'reCAPTCHA response 缺失',
        'invalid-input-response': 'reCAPTCHA response 無效或已過期',
        'bad-request': '請求格式錯誤',
        'timeout-or-duplicate': 'Token 超時或重複使用'
      };

      if (errorCodes && errorCodes.length > 0) {
        console.log('具體錯誤原因:');
        errorCodes.forEach(code => {
          console.log(`- ${code}: ${errorMessages[code] || '未知錯誤'}`);
        });
      }

      return res.status(403).json({ 
        message: 'reCAPTCHA 驗證失敗', 
        errors: errorCodes,
        details: errorCodes?.map(code => errorMessages[code]).filter(Boolean)
      });
    }

    console.log('✅ reCAPTCHA 驗證成功');
    console.log('=== reCAPTCHA 驗證結束 ===');
    next();

  } catch (err) {
    console.error('=== reCAPTCHA 請求異常 ===');
    console.error('錯誤類型:', err.name);
    console.error('錯誤訊息:', err.message);
    console.error('錯誤堆疊:', err.stack);
    
    if (err.response) {
      console.error('HTTP 回應狀態:', err.response.status);
      console.error('HTTP 回應內容:', err.response.data);
    } else if (err.request) {
      console.error('請求發送失敗:', err.request);
    }
    
    return res.status(500).json({ message: '驗證過程錯誤' });
  }
};

module.exports = { verifyRecaptcha };