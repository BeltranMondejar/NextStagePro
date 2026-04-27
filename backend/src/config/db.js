// src/config/db.js
// Conexión a Neon PostgreSQL usando el driver serverless oficial.
// Exporta `query(sql, params)` — úsalo en lugar de pool.query para
// que funcione correctamente en entornos sin conexiones persistentes.

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno');
}

const sql = neon(process.env.DATABASE_URL);

/**
 * Ejecuta una query parametrizada contra Neon.
 * @param {string} text - SQL con placeholders $1, $2…
 * @param {any[]}  params - valores para los placeholders
 * @returns {Promise<{rows: any[], rowCount: number}>}
 */
async function query(text, params = []) {
  const rows = await sql(text, params);
  return { rows, rowCount: rows.length };
}

module.exports = { query };
