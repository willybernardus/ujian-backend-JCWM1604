const { mysqldb } = require('../connection');
const { promisify } = require('util');
const dba = promisify(mysqldb.query).bind(mysqldb);

module.exports = {
    getAllMovies: (req, res) => {
        let sql = `select m.name, m.release_date, m.release_month, m.release_year, m.duration_min, m.genre, m.description, ms.status, l.location, st.time  
        from movies m 
        join movie_status ms on m.status = ms.id
        join schedules sc on m.id = sc.movie_id
        join locations l on sc.location_id = l.id
        join show_times st on sc.time_id = st.id ;`
        mysqldb.query(sql, (error, result) => {
            if (error) return res.status(500).send(error);
            return res.status(200).send(result);
        });
    },
    getMovie: (req, res) => {
        const { status, location, time } = req.query
        if (status) {
            let sql = `select m.name, m.release_date, m.release_month, m.release_year, m.duration_min, m.genre, m.description, ms.status, l.location, st.time  
            from movies m 
            join movie_status ms on m.status = ms.id
            join schedules sc on m.id = sc.movie_id
            join locations l on sc.location_id = l.id
            join show_times st on sc.time_id = st.id
            where ms.status = ? ;`
            mysqldb.query(sql, [status], (error, result) => {
                if (error) return res.status(500).send({ message: "server error" })
                return res.send(result)
            })
        }
        if (location) {
            let sql = `select m.name, m.release_date, m.release_month, m.release_year, m.duration_min, m.genre, m.description, ms.status, l.location, st.time  
            from movies m 
            join movie_status ms on m.status = ms.id
            join schedules sc on m.id = sc.movie_id
            join locations l on sc.location_id = l.id
            join show_times st on sc.time_id = st.id
            where l.location = ?;`
            mysqldb.query(sql, [location], (error, result) => {
                if (error) return res.status(500).send({ message: "server error" })
                return res.send(result)
            })
        }
        if (time) {
            let sql = `select m.name, m.release_date, m.release_month, m.release_year, m.duration_min, m.genre, m.description, ms.status, l.location, st.time  
            from movies m 
            join movie_status ms on m.status = ms.id
            join schedules sc on m.id = sc.movie_id
            join locations l on sc.location_id = l.id
            join show_times st on sc.time_id = st.id 
            where st.time = ?;`
            mysqldb.query(sql, [time], (error, result) => {
                if (error) return res.status(500).send({ message: "server error" })
                return res.send(result)
            })
        }
        if (status && location && time) {
            let sql = `select m.name, m.release_date, m.release_month, m.release_year, m.duration_min, m.genre, m.description, ms.status, l.location, st.time  
            from movies m 
            join movie_status ms on m.status = ms.id
            join schedules sc on m.id = sc.movie_id
            join locations l on sc.location_id = l.id
            join show_times st on sc.time_id = st.id 
            where ms.status = ? and l.location = ? and st.time = ?;`
            mysqldb.query(sql, [status, location, time], (error, result) => {
                if (error) return res.status(500).send({ message: "server error" })
                return res.send(result)
            })
        }
    },
    addMovies: (req, res) => {
        try {
            const { name, genre, release_date, release_month, release_year, duration_min, description, token } = req.body
            const { uid } = req.user
            if (!name || !genre || !release_date || !release_month || !release_year || !duration_min || !description || !token) {
                throw { message: "input tidak boleh kosong" }
            }
            mysqldb.query(`select * from users where uid = ?`, [uid], (error, result) => {
                console.log(result)
                if (result[0].role === 1) {
                    let dataAdd = {
                        name: name,
                        genre: genre,
                        release_date: release_date,
                        release_month: release_month,
                        release_year: release_year,
                        duration_min: duration_min,
                        description: description,
                    }
                    mysqldb.query(`insert into movies set ?`, [dataAdd], (error, result) => {
                        if (error) throw { message: "salah query" }
                        console.log(result)
                        mysqldb.query(`select * from movies`, (error, result) => {
                            if (error) throw { message: "salah add movie" }
                            res.status(201).send({ message: "berhasil tambah movie" })
                        })
                    })
                } else {
                    throw { message: "role harus admin" }
                }
            })
        } catch (error) {
            console.error(error)
            return res.status(500).send(error.message)
        }
    },
    changeStatusMovie: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, token } = req.body
            let dataUpdate = {
                status: status,
            };
            let sql = `update movies set ? where id = ?`
            const dataBaru = await dba(sql, [dataUpdate, id])
            return res.status(200).send({ message: "status has been changed" })
        } catch (error) {
            console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
    addSchedule: (req, res) => {
        try {
            const { location_id, time_id, token } = req.body
            const { uid } = req.user
            if (!location_id || !time_id || !token) throw { message: "input tidak boleh kosong" }
            mysqldb.query(`select * from users where uid = ?`, [uid], (error, result) => {
                if (result[0].role === 1) {
                    let dataToSend = {
                        location_id: location_id,
                        time_id: time_id
                    }
                    mysqldb.query(`insert into movies set ?`, dataToSend, (error) => {
                        if (error) throw { message: "query tipo" }
                        res.status(201).send({ message: "schedule has been addded" })
                    })
                } else {
                    throw { message: "role harus admin" }
                }
            })
        } catch (error) {
            console.error(error)
            return res.status(500).send(error.message)
        }
    },
}