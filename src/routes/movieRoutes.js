const express = require('express');
const router = express.Router();

const { movieController } = require('../controllers')
const { getAllMovies, getMovies, addMoviesAdmin, changeStatusMovieAdmin, addScheduleAdmin } = movieController
const { verifyTokenAccess } = require('../helper/verifyToken')

router.get('/get/all', getAllMovies)
router.get('/get', getMovies)
router.post('/add', verifyTokenAccess, addMoviesAdmin)
router.patch('/edit/:id', verifyTokenAccess, changeStatusMovieAdmin)
router.patch('/set/:id', verifyTokenAccess, addScheduleAdmin)

module.exports = router;