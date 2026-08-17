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

console.log('Running prisma db push...');
try {
  const output = execSync('npx prisma db push --accept-data-loss', { 
    encoding: 'utf8',
    stdio: 'pipe',
    env: process.env
  });
  console.log(output);
  console.log('\n✅ Database migration complete!');
} catch (error) {
  console.error('Migration output:', error.stdout || error.message);
}
