const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

lines.forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && key.trim()) {
    process.env[key.trim()] = rest.join('=').replace(/^"/, '').replace(/"$/, '');
  }
});

console.log('Running db pull to get current schema...');
try {
  execSync('npx prisma db pull --force', { 
    encoding: 'utf8',
    stdio: 'inherit',
    env: process.env
  });
  console.log('\n✅ Schema pulled from database');
} catch (error) {
  console.error('Error:', error.message);
}
