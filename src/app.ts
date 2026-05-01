import express from 'express'
import cors from 'cors'
import walletsRouter from './routes/wallets.routes'
import stocksRouter from './routes/stocks.routes'
import logRouter from './routes/log.routes'

const PORT = parseInt(process.argv[2] || '3000', 10)
const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
	res.send('ok')
})

app.use('/wallets', walletsRouter)
app.use('/stocks', stocksRouter)
app.use('/log', logRouter)

app.post('/chaos', (req, res) => {
	res.status(200).json({})
	process.exit(1)
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
