#!/usr/bin/env node

/**
 * Helper script to generate bcrypt hashes for admin and general passwords
 * Usage: 
 *   node generate-password-hash.js admin [admin-password]
 *   node generate-password-hash.js general [general-password]
 *   node generate-password-hash.js both
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

function promptPassword(rl, promptText) {
  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      resolve(answer);
    });
  });
}

async function generateHashForType(type, password) {
  if (password) {
    console.warn('⚠️  Warning: Password provided as command-line argument may be visible in process history.');
    console.warn('   For better security, run without password argument to enter it interactively.\n');
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    password = await promptPassword(rl, `Enter ${type} password: `);
    rl.close();
  }
  
  if (!password || password.length === 0) {
    console.error(`Error: ${type} password cannot be empty`);
    process.exit(1);
  }
  
  console.log(`\nGenerating bcrypt hash for ${type} password...`);
  const hash = await generateHash(password);
  
  return { password, hash };
}

async function main() {
  const type = process.argv[2]?.toLowerCase();
  const password = process.argv[3];
  
  if (!type || !['admin', 'general', 'both'].includes(type)) {
    console.log('Usage:');
    console.log('  node generate-password-hash.js admin [admin-password]');
    console.log('  node generate-password-hash.js general [general-password]');
    console.log('  node generate-password-hash.js both');
    console.log('\nIf password is not provided, you will be prompted to enter it securely.');
    process.exit(1);
  }
  
  if (type === 'both') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const adminPassword = await promptPassword(rl, 'Enter admin password: ');
    const generalPassword = await promptPassword(rl, 'Enter general password: ');
    rl.close();
    
    if (!adminPassword || adminPassword.length === 0) {
      console.error('Error: admin password cannot be empty');
      process.exit(1);
    }
    if (!generalPassword || generalPassword.length === 0) {
      console.error('Error: general password cannot be empty');
      process.exit(1);
    }
    
    console.log('\nGenerating bcrypt hashes...');
    const adminHash = await generateHash(adminPassword);
    const generalHash = await generateHash(generalPassword);
    
    const adminResult = { password: adminPassword, hash: adminHash };
    const generalResult = { password: generalPassword, hash: generalHash };
    
    console.log('\n✅ Password hashes generated successfully!\n');
    console.log('Add these to your environment variables:');
    console.log('─────────────────────────────────────────');
    console.log(`ADMIN_PASSWORD_HASH="${adminResult.hash}"`);
    console.log(`GENERAL_PASSWORD_HASH="${generalResult.hash}"`);
    console.log('─────────────────────────────────────────\n');
    console.log('Windows (PowerShell):');
    console.log(`  $env:ADMIN_PASSWORD_HASH="${adminResult.hash}"`);
    console.log(`  $env:GENERAL_PASSWORD_HASH="${generalResult.hash}"`);
    console.log('\nWindows (CMD):');
    console.log(`  set ADMIN_PASSWORD_HASH=${adminResult.hash}`);
    console.log(`  set GENERAL_PASSWORD_HASH=${generalResult.hash}`);
    console.log('\nMac/Linux:');
    console.log(`  export ADMIN_PASSWORD_HASH="${adminResult.hash}"`);
    console.log(`  export GENERAL_PASSWORD_HASH="${generalResult.hash}"`);
    console.log('\nOr add to a .env file:');
    console.log(`  ADMIN_PASSWORD_HASH=${adminResult.hash}`);
    console.log(`  GENERAL_PASSWORD_HASH=${generalResult.hash}`);
    console.log('');
  } else {
    const result = await generateHashForType(type, password);
    
    console.log('\n✅ Password hash generated successfully!\n');
    console.log(`Add this to your environment variable:`);
    console.log('─────────────────────────────────────────');
    const envVar = type.toUpperCase() + '_PASSWORD_HASH';
    console.log(`${envVar}="${result.hash}"`);
    console.log('─────────────────────────────────────────\n');
    console.log('Windows (PowerShell):');
    console.log(`  $env:${envVar}="${result.hash}"`);
    console.log('\nWindows (CMD):');
    console.log(`  set ${envVar}=${result.hash}`);
    console.log('\nMac/Linux:');
    console.log(`  export ${envVar}="${result.hash}"`);
    console.log('\nOr add to a .env file:');
    console.log(`  ${envVar}=${result.hash}`);
    console.log('');
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

