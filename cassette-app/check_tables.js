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

// Check schema status
try {
  const output = execSync('npx prisma db execute --stdin --file -', { 
    input: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
  });
  console.log('Tables:', output);
} catch (e) {
  console.log('Checking Prisma introspection instead...');
  // Try introspection
  try {
    const introspect = execSync('npx prisma db pull', {
      encoding: 'utf8',
      env: process.env
    });
    console.log(introspect);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
