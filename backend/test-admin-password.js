const bcrypt = require('bcrypt');

async function testPassword() {
    const password = 'admin123';
    const hash = '$2b$10$1ZWKDZajSu6puCdxHsUZNurwQOF3yOCMvw2WXUXFJYglILi79/oXS';

    const match = await bcrypt.compare(password, hash);
    console.log('Testing password: admin123');
    console.log('Against hash:', hash);
    console.log('Match:', match);

    if (!match) {
        console.log('\n❌ Password does NOT match!');
        console.log('\nTo reset password to admin123, run:');
        console.log('node backend/reset-admin-password.js');
    } else {
        console.log('\n✅ Password matches! You can login with admin123');
    }
}

testPassword();
