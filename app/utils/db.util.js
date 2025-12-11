require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');

// Kiểm tra cấu hình cơ sở dữ liệu
if (!config.db || !config.db.host || !config.db.user || !config.db.database) {
    throw new Error('Cấu hình cơ sở dữ liệu không đầy đủ. Vui lòng kiểm tra tệp config.');
}

// Thiết lập pool với các giá trị mặc định
const pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit || 10, // Giá trị mặc định
    queueLimit: config.db.queueLimit || 0
});

const pool2 = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database2,
    waitForConnections: true,
    connectionLimit: config.db.connectionLimit || 10, // Giá trị mặc định
    queueLimit: config.db.queueLimit || 0
});


// Kiểm tra kết nối
(async () => {
    try {
        // Test Pool 1
        const conn1 = await pool.getConnection();
        console.log(`✅ Kết nối DB Chính (${config.db.database}) thành công!`);
        conn1.release();

        // Test Pool 2
        const conn2 = await pool2.getConnection();
        console.log(`✅ Kết nối DB Phụ (${config.db.database2}) thành công!`);
        conn2.release();
    } catch (error) {
        console.error('❌ Lỗi kết nối MySQL:', error.message);
        // Tùy chọn: process.exit(1) nếu DB chết thì sập server luôn
    }
})();

// XUẤT RA CẢ 2 POOL DƯỚI DẠNG OBJECT
// Tôi khuyên nên đặt tên rõ ràng hơn thay vì pool/pool2
module.exports = { 
    pool, 
    pool2 
};