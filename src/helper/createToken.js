const jwt = require('jsonwebtoken')

module.exports = {
    createAccessToken: (data) => {
        const key = process.env.TOKEN_1;
        const token = jwt.sign(data, key, { expiresIn: '10h' });
        return token
    },
};