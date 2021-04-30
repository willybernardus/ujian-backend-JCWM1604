'use strict';
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
app.use(cors({
    exposedHeaders: ['Content-Length', 'x-token-access', 'x-token-refresh', 'x-token-count']
}));
const bearerToken = require('express-bearer-token');
app.use(bearerToken())
const PORT = process.env.PORT
const morgan = require('morgan')
morgan.token('logger', (req, res) => { return new Date() })
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :logger"))

app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(express.static('public'));
console.log(__dirname)

app.get('/', (req, res) => {
    res.status(200).send("<center><h1>API Ujian BackEnd</h1></center>")
})


// const { mysqldb } = require('./src/connection')

const { authRoutes, movieRoutes } = require('./src/routes')

app.use('/user', authRoutes)
app.use('/movies', movieRoutes)

app.use('*', (req, res) => {
    res.status(404).send("Page not found")
})

app.listen(PORT, () => {
    console.log(`Listen in port ${PORT}`)
})