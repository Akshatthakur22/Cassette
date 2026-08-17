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

// Run prisma db push with accept-data-loss
try {
  const output = execSync('npx prisma db push --accept-data-loss --skip-generate', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log(output);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
