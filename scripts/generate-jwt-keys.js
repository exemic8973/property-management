const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate RSA key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Save keys to files
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

console.log('✅ JWT keys generated successfully!');
console.log(`📁 Private key: ${path.join(keysDir, 'private.pem')}`);
console.log(`📁 Public key: ${path.join(keysDir, 'public.pem')}`);
console.log('');
console.log('Add these to your .env file:');
console.log('');
console.log('JWT_PRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"');
console.log('');
console.log('JWT_PUBLIC_KEY="' + publicKey.replace(/\n/g, '\\n') + '"');
