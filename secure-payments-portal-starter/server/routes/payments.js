import express from 'express';
import { paymentSchema } from '../schemas/validation.js';
import { validate } from '../middleware/validate.js';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, validate(paymentSchema), async (req, res) => {
    const { beneficiary_name, beneficiary_iban, beneficiary_bic, amount, currency, reference } = req.body;
    try {
        const { rows } = await pool.query(`
      insert into payments(user_id, beneficiary_name, beneficiary_iban, beneficiary_bic, amount, currency, reference)
      values($1,$2,$3,$4,$5,$6,$7)
      returning id, created_at
    `, [req.user.id, beneficiary_name, beneficiary_iban, beneficiary_bic, amount, currency, reference || null]);
        return res.json({ ok: true, payment_id: rows[0].id, created_at: rows[0].created_at });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: 'server_error' });
    }
});

router.get('/', requireAuth, async (req, res) => {
    const { rows } = await pool.query(
        'select * from payments where user_id=$1 order by created_at desc',
        [req.user.id]
    );
    res.json({ ok: true, items: rows });
});


router.get('/pending', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM payments WHERE (verified = false OR submitted = false) AND rejected = false ORDER BY created_at DESC`
        );
        res.json({ ok: true, items: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: 'server_error' });
    }
});

router.post('/:id/verify', requireAuth, async (req, res) => {
    const paymentId = req.params.id;
    try {
        const { rowCount } = await pool.query(
            `UPDATE payments SET verified = true, verified_by = $1, verified_at = now() WHERE id = $2 AND verified = false RETURNING id`,
            [req.user.id, paymentId]
        );
        if (rowCount === 0) {
            return res.status(404).json({ ok: false, error: 'Payment not found or already verified' });
        }
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: 'server_error' });
    }
});

router.post('/submit', requireAuth, async (req, res) => {
    try {
        const { rowCount } = await pool.query(
            `UPDATE payments SET submitted = true, submitted_at = now() WHERE verified = true AND submitted = false`
        );
        res.json({ ok: true, updated: rowCount });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: 'server_error' });
    }
});

router.post('/:id/reject', requireAuth, async (req, res) => {
  const paymentId = req.params.id;
  const { reason } = req.body;
  try {
    const { rowCount } = await pool.query(
      `UPDATE payments
       SET rejected = true,
           rejected_by = $1,
           rejected_at = now(),
           rejection_reason = $2
       WHERE id = $3 AND rejected = false AND submitted = false
       RETURNING id`,
      [req.user.id, reason || null, paymentId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ ok: false, error: 'Payment not found or already rejected/submitted' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'server_error' });
  }
});

export default router;
