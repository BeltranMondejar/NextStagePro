
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en las variables de entorno');
}

const sql = neon(process.env.DATABASE_URL);

/**
 * @param {string} text
 * @param {any[]}  params
 * @returns {Promise<{rows: any[], rowCount: number}>}
 */
async function query(text, params = []) {
  const rows = await sql(text, params);
  return { rows, rowCount: rows.length };
}

module.exports = { query };
