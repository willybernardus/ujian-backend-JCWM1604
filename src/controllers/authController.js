const { mysqldb } = require('../connection');
const { createAccessToken, createTokenRefresh, createEmailVerivication } = require('../helper/createToken')
const hashpassword = require('../helper/hashingPass')
const path = require('path');
const { promisify } = require('util');
const dba = promisify(mysqldb.query).bind(mysqldb);
const jwt = require('jsonwebtoken')

module.exports = {
    register: async (req, res) => {
        try {
            const { email, password, username } = req.body;
            if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
                return res.status(400).send({ message: 'email invalid' })
            } else {
                res.status(200)
            }
            let number = /[0-9]/g;
            let lowerCase = /[a-z]/g;
            let specialChar = /[!@#$%^&*]/g;
            if (!email || !password || !username) {
                return res.status(400).send({ message: 'bad request' })
            } if (!password.match(number)) {
                return res.status(400).send({ message: "password must contain at least a number" })
            } if (!password.match(lowerCase)) {
                return res.status(400).send({ message: "password must contain at least a lowercase" })
            } if (!password.match(specialChar)) {
                return res.status(400).send({ message: "password must contain at least a special character" })
            } if (password.length < 6) {
                return res.status(400).send({ message: "password must contain at least 6 characters or more" })
            } if (username.length < 6) {
                return res.status(400).send({ message: "username at least has 6 characters" })
            }
            let sql = `select * from users where email = ?`
            let dataUsers = await dba(sql, [email])
            if (dataUsers.length) {
                return res.status(500).send({ message: 'email has been registered' })
            }
            // insert user ke table users
            sql = `insert into users set ?`
            const uid = Date.now();
            console.log(uid)
            let dataToSend = {
                uid: uid,
                email: email,
                username: username,
                password: hashpassword(password)
            }
            await dba(sql, [dataToSend]);
            // get lagi datanya sebagai response dari database
            sql = `select id, uid, username, email from users where uid = ?`;
            dataUsers = await dba(sql, [uid]);
            let dataToken = {
                uid: dataUsers[0].uid,
                role: dataUsers[0].role
            };
            const tokenAccess = createAccessToken(dataToken);
            res.set('x-token-access', tokenAccess);
            return res.status(201).send({ ...dataUsers[0], token: tokenAccess });
        } catch (error) {
            console.error(error)
            return res.status(500).send({ message: 'server error' })
        }
    },
    login: async (req, res) => {
        try {
            const { user, password } = req.body
            if (!user || !password) {
                return res.status(400).send({ message: 'bad request' })
            }
            let sql = `select * from users where (email = ? or username = ?) and password = ? and status = 2`
            const deactiveUser = await dba(sql, [user, user, hashpassword(password)])
            if (deactiveUser.length) {
                return res.status(403).send({ message: 'user deactive' })
            }
            sql = `select * from users where (email = ? or username = ?) and password = ? and status = 3`
            const closedUser = await dba(sql, [user, user, hashpassword(password)])
            if (closedUser.length) {
                return res.status(403).send({ message: `Oops! user's account has been closed, can not login anymore` })
            }
            sql = `select id, uid, username, email, status, role from users where (email = ? or username = ?) and password = ?`
            const dataUser = await dba(sql, [user, user, hashpassword(password)])
            if (dataUser.length) {
                let dataToken = {
                    uid: dataUser[0].uid,
                    role: dataUser[0].role
                }
                const tokenAccess = createAccessToken(dataToken);
                res.set("x-token-access", tokenAccess);
                return res.status(200).send({ ...dataUser[0], token: tokenAccess })
            } else {
                return res.status(500).send({ message: "username / email has been registered or password is wrong" })
            }
        } catch (error) {
            console.error(error)
            return res.status(500).send({ message: 'server error' })
        }
    },
    deactiveUser: async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).send({ message: "token needed" })
            }
            if (token === req.token) {
                // console.log('isi dari req.token', req.token)
                const { uid } = req.user;
                let sql = `select * from users where uid = ? and status = 3`
                const userClosed = await dba(sql, [uid])
                if (userClosed.length) {
                    return res.status(403).send({ message: `Oops! user's account has been closed, can not deactivate account` })
                }
                let dataUpdate = {
                    status: 2
                };
                sql = `update users set ? where uid = ?`
                await dba(sql, [dataUpdate, uid])
                sql = `select u.uid, s.status from users u join status s on u.status = s.id where uid = ?`
                const dataUser = await dba(sql, [uid])
                return res.status(200).send(dataUser)
            } else {
                // console.log('isi dari req.user', req.user)
                return res.status(401).send({ message: "access denied" })
            }
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
    activateUser: async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).send({ message: "token needed" })
            }
            if (token === req.token) {
                // console.log('isi dari req.token', req.token)
                const { uid } = req.user;
                let sql = `select * from users where uid = ? and status = 3`
                const userClosed = await dba(sql, [uid])
                if (userClosed.length) {
                    return res.status(403).send({ message: `Oops! user's account has been closed, can not activate account` })
                }
                let dataUpdate = {
                    status: 1
                };
                sql = `update users set ? where uid = ?`
                await dba(sql, [dataUpdate, uid])
                sql = `select u.uid, s.status from users u join status s on u.status = s.id where uid = ?`
                const dataUser = await dba(sql, [uid])
                return res.status(200).send(dataUser)
            } else {
                // console.log('isi dari req.user', req.user)
                return res.status(401).send({ message: "access denied" })
            }

        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
    closeUser: async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).send({ message: "token needed" })
            }
            if (token === req.token) {
                // console.log('isi dari req.token', req.token)
                const { uid } = req.user;
                let dataUpdate = {
                    status: 3
                };
                let sql = `update users set ? where uid = ?`
                await dba(sql, [dataUpdate, uid])
                sql = `select u.uid, s.status from users u join status s on u.status = s.id where uid = ?`
                const dataUser = await dba(sql, [uid])
                return res.status(200).send(dataUser)
            } else {
                // console.log('isi dari req.user', req.user)
                return res.status(401).send({ message: "access denied" })
            }
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
};




