const crypto = require('crypto');
const hashpassword = (password) => {
    let kataKunci = process.env.HASH_KEY
    return crypto.createHmac('sha256', kataKunci).update(password).digest('hex')
};

module.exports = hashpassword