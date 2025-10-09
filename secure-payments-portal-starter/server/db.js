import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});

export async function initDb(){
  await pool.query(`
    create table if not exists users(
      id serial primary key,
      email varchar(255) unique not null,
      password_hash varchar(255) not null,
      created_at timestamptz default now()
    );
    create table if not exists payments(
      id serial primary key,
      user_id int references users(id) on delete cascade,
      beneficiary_name varchar(120) not null,
      beneficiary_iban varchar(34) not null,
      beneficiary_bic varchar(11) not null,
      amount numeric(14,2) not null check (amount>0),
      currency char(3) not null,
      reference varchar(140),
      created_at timestamptz default now()
    );
  `);
}
