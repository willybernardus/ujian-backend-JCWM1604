const jwt = require('jsonwebtoken')

module.exports.verifyTokenAccess = (req, res, next) => {
    console.log('token', req.token)
    const token = req.token
    const key = process.env.TOKEN_1;
    jwt.verify(token, key, (error, decoded) => {
        if (error) return res.status(401).send({ message: "user unauthorize" })
        console.log('isi decoded', decoded);
        req.user = decoded;
        next();
    })
}