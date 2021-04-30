const express = require('express');
const router = express.Router();

const { movieController } = require('../controllers')
const { getAllMovies, getMovie, addMovies, changeStatusMovie, addSchedule } = movieController
const { verifyTokenAccess } = require('../helper/verifyToken')

router.get('/get/all', getAllMovies)
router.get('/get', getMovie)
router.post('/add', verifyTokenAccess, addMovies)
router.patch('/edit/:id', changeStatusMovie)
router.patch('/set/:id', addSchedule)

module.exports = router;