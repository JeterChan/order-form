const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
  const token = req.body['g-recaptcha-response'];
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!token) {
    return res.status(400).json({ message: '缺少 reCAPTCHA token' });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: secret,
        response: token,
        remoteip: req.ip  // USER IP ADDRESS
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { success, score, 'error-codes': errorCodes } = response.data;

    if (!success) {
      return res.status(403).json({ message: 'reCAPTCHA 驗證失敗', errors: errorCodes });
    }

    next();
  } catch (err) {
    console.error('reCAPTCHA 錯誤:', err.message);
    return res.status(500).json({ message: '驗證過程錯誤' });
  }
};

module.exports = {verifyRecaptcha};