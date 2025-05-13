const bcrypt = require('bcrypt');

async function generateHash() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Admin123!', salt);
    console.log('New hash for Admin123!:', hash);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();