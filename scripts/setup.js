const fs = require('fs');

// Copy .env.example -> .env
fs.copyFile('.env.example', '.env', (err) => {
  if (err) {
    console.error('❌ Lỗi khi copy file:', err);
  } else {
    console.log('✅ Copy .env.example -> .env thành công!');
  }
});
