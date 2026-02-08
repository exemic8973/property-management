const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Authentication Service Setup...\n');

const checks = [];

// Check auth module files
const authFiles = [
  'apps/backend/src/auth/auth.module.ts',
  'apps/backend/src/auth/auth.service.ts',
  'apps/backend/src/auth/auth.controller.ts',
  'apps/backend/src/auth/jwt.strategy.ts',
  'apps/backend/src/auth/jwt-auth.guard.ts',
  'apps/backend/src/auth/roles.guard.ts',
  'apps/backend/src/auth/roles.decorator.ts',
  'apps/backend/src/auth/dto/register.dto.ts',
  'apps/backend/src/auth/dto/login.dto.ts',
  'apps/backend/src/auth/dto/refresh-token.dto.ts',
  'apps/backend/src/auth/decorators/public.decorator.ts',
  'apps/backend/src/auth/index.ts',
];

authFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  checks.push({ name: file, exists, type: 'file' });
});

// Check database package files
const dbFiles = [
  'packages/database/src/prisma.service.ts',
  'packages/database/src/index.ts',
];

dbFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  checks.push({ name: file, exists, type: 'file' });
});

// Check JWT keys
const keyFiles = [
  'keys/private.pem',
  'keys/public.pem',
];

keyFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  checks.push({ name: file, exists, type: 'file' });
});

// Check documentation
const docFiles = [
  'apps/backend/AUTH_SETUP.md',
];

docFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  checks.push({ name: file, exists, type: 'file' });
});

// Display results
let allPassed = true;
checks.forEach(check => {
  const status = check.exists ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (!check.exists) allPassed = false;
});

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('✅ All authentication service files are present!\n');
  console.log('Next steps:');
  console.log('1. Copy JWT keys from keys/ to your .env file');
  console.log('2. Run: npm install');
  console.log('3. Run: cd packages/database && npm run generate && npm run push');
  console.log('4. Run: cd apps/backend && npm run dev');
  console.log('5. Visit: http://localhost:3001/api/docs');
} else {
  console.log('❌ Some files are missing. Please review the setup.');
  process.exit(1);
}

console.log('='.repeat(60));