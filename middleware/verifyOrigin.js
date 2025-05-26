const verifyOrigin = (req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    if(!origin || !origin.startsWith(process.env.ALLOWED_ORIGIN)) {
        return res.status(403).json({message: '來源不合法'});
    }
    next();
};

module.exports = {verifyOrigin};