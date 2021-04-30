const express = require('express');
const router = express.Router();

const { authController } = require('../controllers')
const { register, login, deactiveUser, activateUser, closeUser } = authController
const { verifyTokenAccess } = require('../helper/verifyToken')

router.post('/register', register)
router.post('/login', login)
router.patch('/deactive', verifyTokenAccess, deactiveUser)
router.patch('/activate', verifyTokenAccess, activateUser)
router.patch('/close', verifyTokenAccess, closeUser)

module.exports = router;