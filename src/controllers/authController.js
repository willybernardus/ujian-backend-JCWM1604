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
            sql = `select * from users where uid = ?`;
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
            let sql = `select * from users where (email = ? or username = ?) and password = ? and status = 'deleted'`
            // console.log(sql)
            const deletedUser = await dba(sql, [user, user, hashpassword(password)])
            // console.log(deletedUser, "ini deleted user")
            if (deletedUser.length != 0) {
                return res.status(403).send({ message: 'forbidden' })
            }
            sql = `select * from users where (email = ? or username = ?) and password = ?`
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
                return res.status(500).send({ message: "username/email tidak terdaftar atau password salah" })
            }
        } catch (error) {
            console.error(error)
            return res.status(500).send({ message: 'server error' })
        }
    },
    changeToAdmin: async (req, res) => {
        try {
            const { uid } = req.params;
            if (req.params.uid === req.user.uid) {
                let dataUpdate = {
                    role: 1
                };
                let sql = `update users set ? where uid = ?`
                await dba(sql, [dataUpdate, id])
                return res.status(200).send({ message: "updated" })
            }
            return res.status(401).send({ message: "id unauthorize" })
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            if (req.params.id === req.user.id) {
                let sql = `select * from users where id = ? and role = 'user'`
                const roleUser = await dba(sql, [id])
                if (!(roleUser.length)) {
                    return res.status(400).send({ message: "role harus user" })
                }
                let dataUpdate = {
                    status: 'deleted'
                };
                sql = `update users set ? where id = ?`
                await dba(sql, [dataUpdate, id])
                return res.status(200).send({ message: "account deleted" })
            }
            return res.status(401).send({ message: "id unauthorize" })
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
    deactiveUser: async (req, res) => {
        try {
            const { token } = req.body;
            const { uid } = req.user;
            let dataUpdate = {
                status: 2
            };
            let sql = `update users set ? where uid = ?`
            await dba(sql, [dataUpdate, uid])
            sql = `select uid, status from users where uid = ?`
            const dataUser = await dba(sql, [uid])
            return res.status(200).send(dataUser)
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
    activateUser: async (req, res) => {
        try {
            const { token } = req.body;
            const { uid } = req.user;
            let dataUpdate = {
                status: 1
            };
            let sql = `update users set ? where id = ?`
            await dba(sql, [dataUpdate, uid])
            sql = `select uid,status from users where id = ?`
            const dataUser = await dba(sql, [uid])
            return res.status(200).send(dataUser)

        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
    closeUser: async (req, res) => {
        try {
            const { token } = req.body;
            const { uid } = req.user;
            let dataUpdate = {
                status: 3
            };
            let sql = `update users set ? where id = ?`
            await dba(sql, [dataUpdate, uid])
            sql = `select uid,status from users where id = ?`
            const dataUser = await dba(sql, [uid])
            return res.status(200).send(dataUser)

        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },

};




