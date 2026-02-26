#!/usr/bin/env node

/**
 * Script para atualizar apenas a senha do banco de dados
 * Execute com: node scripts/update-password.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updatePassword() {
  console.log('🔧 Atualizador de Senha do Supabase\n');

  try {
    // Ler o arquivo .env atual
    const envPath = path.join(projectRoot, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Extrair a senha atual da DATABASE_URL
    const dbUrlMatch = envContent.match(/DATABASE_URL=postgresql:\/\/postgres\.[^:]+:([^@]+)@/);

    if (dbUrlMatch) {
      console.log('🔒 Senha atual encontrada no arquivo .env');
    } else {
      console.log('⚠️ Não foi possível encontrar a senha atual');
    }

    // Pedir nova senha
    const newPassword = await question('🔐 Digite a nova senha do banco de dados Supabase: ');

    // Atualizar a DATABASE_URL
    const updatedContent = envContent.replace(
      /(DATABASE_URL=postgresql:\/\/postgres\.[^:]+):[^@]+(@)/,
      `$1:${newPassword}$2`
    );

    // Salvar o arquivo atualizado
    fs.writeFileSync(envPath, updatedContent);

    console.log('\n✅ Senha atualizada com sucesso!');

    // Testar a conexão
    console.log('\n🧪 Testando nova conexão...');
    const { execSync } = await import('child_process');

    try {
      const testResult = execSync('node scripts/test-db-connection.js', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log(testResult);
      console.log('\n🎉 Conexão bem-sucedida!');
      console.log('🚀 Execute "npm run db:push" para criar as tabelas');
      console.log('🚀 Execute "npm run dev" para iniciar a aplicação');

    } catch (testError) {
      console.log('❌ A senha ainda está incorreta:');
      console.log(testError.stdout || testError.message);
      console.log('\n🔧 Verifique a senha no dashboard do Supabase > Settings > Database');
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error.message);
  } finally {
    rl.close();
  }
}

updatePassword();
