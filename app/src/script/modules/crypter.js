const crypto = require('crypto');

const encrypt = (plaintext, key, callback) => {
  const cipher = crypto.createCipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
  let encrypted = '';
  cipher.on('readable', () => {
    let chunk;
    while (null !== (chunk = cipher.read())) {
      encrypted += chunk.toString('base64');
    }
  });
  cipher.on('end', () => callback(encrypted));
  cipher.write(plaintext);
  cipher.end();
}

const decrypt = (ciphertext, key, callback) => {
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, Buffer.alloc(16, 0));
  let decrypted = '';
  decipher.on('readable', () => {
    while (null !== (chunk = decipher.read())) {
      decrypted += chunk.toString('utf8');
    }
  });
  decipher.on('end', () => callback(decrypted));
  decipher.write(ciphertext, 'base64');
  decipher.end();
}

module.exports = {
  encrypt, decrypt
};
