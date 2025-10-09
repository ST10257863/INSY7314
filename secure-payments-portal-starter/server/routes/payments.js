import express from 'express';
import { paymentSchema } from '../schemas/validation.js';
import { validate } from '../middleware/validate.js';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, validate(paymentSchema), async (req,res) => {
  const { beneficiary_name, beneficiary_iban, beneficiary_bic, amount, currency, reference } = req.body;
  try{
    const { rows } = await pool.query(`
      insert into payments(user_id, beneficiary_name, beneficiary_iban, beneficiary_bic, amount, currency, reference)
      values($1,$2,$3,$4,$5,$6,$7)
      returning id, created_at
    `,[req.user.id, beneficiary_name, beneficiary_iban, beneficiary_bic, amount, currency, reference || null]);
    return res.json({ ok:true, payment_id: rows[0].id, created_at: rows[0].created_at });
  }catch(e){
    console.error(e);
    res.status(500).json({ ok:false, error:'server_error' });
  }
});

router.get('/', requireAuth, async (req,res)=>{
  const { rows } = await pool.query('select * from payments where user_id=$1 order by created_at desc', [req.user.id]);
  res.json({ ok:true, items: rows });
});

export default router;
