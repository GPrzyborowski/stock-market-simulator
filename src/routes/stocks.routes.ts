import { Router } from 'express'
import pool from '../db'

const router = Router()

router.get('/', async (req, res) => {
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

router.post('/', async (req, res) => {
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

export default router
