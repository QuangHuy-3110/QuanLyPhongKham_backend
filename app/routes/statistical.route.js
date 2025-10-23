const express = require('express');
const statistical = require('../controllers/statistical.controller');

const router = express.Router();

/**
 * ==============================
 * 📊 ROUTES THỐNG KÊ HỆ THỐNG
 * ==============================
 */

// 1️⃣ Tổng số bệnh nhân và số bệnh nhân đã kích hoạt
router.get('/benhnhan-stats', statistical.getBenhNhanStats);

// 2️⃣ Số lịch hẹn chưa khám
router.get('/lichhen-chuakham', statistical.getLichHenChuaKham);

// 3️⃣ Số lượng hồ sơ khám bệnh
router.get('/hoso-khambenh', statistical.getHoSoKhamBenh);

// 4️⃣ Số lượng bác sĩ
router.get('/soluong-bacsi', statistical.getSoLuongBacSi);

// 5️⃣ Thống kê thu chi (chi tiết theo ngày và theo tháng)
router.get('/thuchi-stats', statistical.getThuChiStats);

// 6️⃣ Thống kê từng bác sĩ (số buổi làm, giờ làm, bệnh nhân theo tháng/năm)
router.get('/bacsi-stats', statistical.getBacSiStats);

module.exports = router;
