#!/usr/bin/env node

/**
 * Helper script to generate a bcrypt hash for your password
 * Usage: node generate-password-hash.js [password]
 * 
 * If no password is provided, it will prompt you to enter one securely.
 */

const bcrypt = require('bcrypt');
const readline = require('readline');

async function generateHash(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

async function main() {
  let password;
  
  if (process.argv[2]) {
    password = process.argv[2];
    console.warn('⚠️  Warning: Password provided as command-line argument may be visible in process history.');
    console.warn('   For better security, run without arguments to enter password interactively.\n');
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    password = await new Promise((resolve) => {
      rl.question('Enter your password: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
  
  if (!password || password.length === 0) {
    console.error('Error: Password cannot be empty');
    process.exit(1);
  }
  
  console.log('\nGenerating bcrypt hash...');
  const hash = await generateHash(password);
  
  console.log('\n✅ Password hash generated successfully!\n');
  console.log('Add this to your environment variable:');
  console.log('─────────────────────────────────────────');
  console.log(`PASSWORD_HASH="${hash}"`);
  console.log('─────────────────────────────────────────\n');
  console.log('Windows (PowerShell):');
  console.log(`  $env:PASSWORD_HASH="${hash}"`);
  console.log('\nWindows (CMD):');
  console.log(`  set PASSWORD_HASH=${hash}`);
  console.log('\nMac/Linux:');
  console.log(`  export PASSWORD_HASH="${hash}"`);
  console.log('\nOr add to a .env file:');
  console.log(`  PASSWORD_HASH=${hash}`);
  console.log('');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

