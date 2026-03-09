/**
 * Script para verificar conta específica - MATERIAL CASTURINO
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkAccount() {
  try {
    await client.connect();
    
    // Buscar conta MATERIAL CASTURINO
    const query = `
      SELECT id, description, due_date, payment_date, original_due_date, status, supplier_id
      FROM accounts_payable 
      WHERE description ILIKE '%MATERIAL CASTURINO%'
      OR description ILIKE '%CASTURINO%'
      ORDER BY description
    `;
    
    const result = await client.query(query);
    
    console.log(`Encontradas ${result.rows.length} conta(s)\n`);
    
    for (const row of result.rows) {
      console.log('─'.repeat(80));
      console.log(`ID: ${row.id}`);
      console.log(`Descrição: ${row.description}`);
      console.log(`Status: ${row.status}`);
      console.log(`due_date: ${row.due_date}`);
      console.log(`payment_date: ${row.payment_date}`);
      console.log(`original_due_date: ${row.original_due_date || '(vazio)'}`);
      console.log(`supplier_id: ${row.supplier_id}`);
      
      // Verificar se precisa de ajuste
      if (row.status === 'paid' && row.payment_date && row.due_date !== row.payment_date && !row.original_due_date) {
        console.log('\n⚠️ Esta conta PRECISA de ajuste!');
      }
      console.log('─'.repeat(80));
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

checkAccount();
