import express from 'express'
import cors from 'cors'

const PORT = 5000
const app = express()

app.use(cors())

app.get("/health", (req, res) => {
    res.send("ok")
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
