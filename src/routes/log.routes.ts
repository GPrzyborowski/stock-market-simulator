import { Router } from 'express'
import pool from '../db'

const router = Router()

router.get('/', async (req, res) => {
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

export default router
