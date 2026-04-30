import express from 'express'
import cors from 'cors'
import pool from './db' 

const PORT = 3000
const app = express()

app.use(cors())

app.get("/health", (req, res) => {
    res.send("ok")
})

app.get("/", async (req, res) => {
    const data = await pool.query("SELECT * FROM bank")
    res.status(200).json(data.rows)
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
