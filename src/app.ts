import express from 'express'
import cors from 'cors'
import pool from './db'

const PORT = parseInt(process.argv[2] || '3000', 10)
const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
	res.send('ok')
})

app.post('/wallets/:wallet_id/stocks/:stock_name', async (req, res) => {
	const { wallet_id, stock_name } = req.params
	const { type } = req.body
	const client = await pool.connect()
	try {
		await client.query('BEGIN')

		const stockResult = await client.query('SELECT stock_id FROM stock WHERE stock_name=$1', [stock_name])
		if (stockResult.rows.length === 0) {
			await client.query('ROLLBACK')
			res.status(404).json({ error: 'Stock not found' })
			return
		}
		const stock_id = stockResult.rows[0].stock_id

		await client.query('INSERT INTO wallet (wallet_id) VALUES ($1) ON CONFLICT DO NOTHING', [wallet_id])

		const bankResult = await client.query('SELECT quantity FROM bank WHERE stock_id=$1 FOR UPDATE', [stock_id])
		const bankQuantity = bankResult.rows[0]?.quantity ?? 0

		if (type === 'buy') {
			if (bankQuantity < 1) {
				await client.query('ROLLBACK')
				res.status(400).json({ error: 'No stock available in bank' })
				return
			}
			await client.query('UPDATE bank SET quantity=quantity-1 WHERE stock_id=$1', [stock_id])
			await client.query(
				'INSERT INTO ownership (wallet_id, stock_id, quantity) VALUES ($1,$2,1) ON CONFLICT (wallet_id, stock_id) DO UPDATE SET quantity=ownership.quantity+1',
				[wallet_id, stock_id],
			)
		} else if (type === 'sell') {
			const ownershipResult = await client.query(
				'SELECT quantity FROM ownership WHERE wallet_id=$1 AND stock_id=$2 FOR UPDATE',
				[wallet_id, stock_id],
			)
			const walletQuantity = ownershipResult.rows[0]?.quantity ?? 0
			if (walletQuantity < 1) {
				await client.query('ROLLBACK')
				res.status(400).json({ error: 'No stock in wallet' })
				return
			}
			await client.query('UPDATE ownership SET quantity=quantity-1 WHERE wallet_id=$1 AND stock_id=$2', [
				wallet_id,
				stock_id,
			])
			await client.query('UPDATE bank SET quantity=quantity+1 WHERE stock_id=$1', [stock_id])
		} else {
			await client.query('ROLLBACK')
			res.status(400).json({ error: 'Invalid type' })
			return
		}

		await client.query('INSERT INTO audit_log (wallet_id, stock_id, type) VALUES ($1,$2,$3)', [
			wallet_id,
			stock_id,
			type,
		])

		await client.query('COMMIT')
		res.status(200).json({})
	} catch (err) {
		await client.query('ROLLBACK')
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	} finally {
		client.release()
	}
})

app.get('/wallets/:wallet_id', async (req, res) => {
	const { wallet_id } = req.params
	try {
		const result = await pool.query(
			'SELECT s.stock_name AS name, o.quantity FROM ownership o JOIN stock s ON o.stock_id=s.stock_id WHERE o.wallet_id=$1 ORDER BY s.stock_name',
			[wallet_id],
		)
		res.status(200).json({ id: wallet_id, stocks: result.rows })
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

app.get('/wallets/:wallet_id/stocks/:stock_name', async (req, res) => {
	const { wallet_id, stock_name } = req.params
	try {
		const result = await pool.query(
			'SELECT o.quantity FROM ownership o JOIN stock s ON o.stock_id=s.stock_id WHERE o.wallet_id=$1 AND s.stock_name=$2',
			[wallet_id, stock_name],
		)
		res.status(200).json(result.rows[0]?.quantity ?? 0)
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

app.get('/stocks', async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT s.stock_name AS name, b.quantity FROM bank AS b JOIN stock AS s ON b.stock_id=s.stock_id ORDER BY s.stock_name',
		)
		res.status(200).json({ stocks: result.rows })
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

app.post('/stocks', async (req, res) => {
	const { stocks } = req.body
	const client = await pool.connect()
	try {
		await client.query('BEGIN')
		for (const { name, quantity } of stocks) {
			const stockResult = await client.query('SELECT stock_id FROM stock WHERE stock_name=$1', [name])
			if (stockResult.rows.length === 0) {
				await client.query('ROLLBACK')
				return res.status(404).json({ error: `Stock ${name} not found` })
			}
			const stock_id = stockResult.rows[0].stock_id
			await client.query(
				'INSERT INTO bank (stock_id, quantity) VALUES ($1,$2) ON CONFLICT (stock_id) DO UPDATE SET quantity=$2',
				[stock_id, quantity],
			)
		}
		await client.query('COMMIT')
		res.status(200).json({})
	} catch (err) {
		await client.query('ROLLBACK')
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	} finally {
		client.release()
	}
})

app.get('/log', async (req, res) => {
	try {
		const result = await pool.query(
			'SELECT a.type, a.wallet_id, s.stock_name FROM audit_log a JOIN stock s ON a.stock_id=s.stock_id ORDER BY a.log_id',
		)
		res.status(200).json({ log: result.rows })
	} catch (err) {
		console.error(err)
		return res.status(500).json({ error: 'Server error' })
	}
})

app.post('/chaos', (req, res) => {
	res.status(200).json({})
	process.exit(1)
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
