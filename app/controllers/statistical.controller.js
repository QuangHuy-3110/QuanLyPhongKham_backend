const StatisticalService = require('../services/statistical.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.getBenhNhanStats = async (req, res, next) => {
    try {
        const statisticalService = new StatisticalService(pool);
        const stats = await statisticalService.getBenhNhanStats();
        return res.status(200).json(stats);
    } catch (error) {
        // Truyền lỗi trực tiếp từ StatisticalService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy thống kê bệnh nhân'));
    }
};

exports.getLichHenChuaKham = async (req, res, next) => {
    try {
        const statisticalService = new StatisticalService(pool);
        const stats = await statisticalService.getLichHenChuaKham();
        return res.status(200).json(stats);
    } catch (error) {
        // Truyền lỗi trực tiếp từ StatisticalService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy số lịch hẹn chưa khám'));
    }
};

exports.getHoSoKhamBenh = async (req, res, next) => {
    try {
        const statisticalService = new StatisticalService(pool);
        const stats = await statisticalService.getHoSoKhamBenh();
        return res.status(200).json(stats);
    } catch (error) {
        // Truyền lỗi trực tiếp từ StatisticalService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy số lượng hồ sơ khám bệnh'));
    }
};

exports.getSoLuongBacSi = async (req, res, next) => {
    try {
        const statisticalService = new StatisticalService(pool);
        const stats = await statisticalService.getSoLuongBacSi();
        return res.status(200).json(stats);
    } catch (error) {
        // Truyền lỗi trực tiếp từ StatisticalService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy số lượng bác sĩ'));
    }
};

exports.getThuChiStats = async (req, res, next) => {
    try {
        const statisticalService = new StatisticalService(pool);
        const { dailyStats, monthlyStats } = await statisticalService.getThuChiStats();

        return res.status(200).json({
            success: true,
            message: 'Lấy thống kê thu chi thành công',
            data: {
                dailyStats,   // thống kê từng ngày trong tháng hiện tại
                monthlyStats  // thống kê từng tháng trong năm hiện tại
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê thu chi:', error);
        return next(
            error instanceof ApiError
                ? error
                : new ApiError(500, 'Lỗi khi lấy thống kê thu chi từ cơ sở dữ liệu')
        );
    }
};


exports.getBacSiStats = async (req, res, next) => {
    try {
        const { thang, nam } = req.query; // Lấy từ query params (?thang=10&nam=2025)

        // Default: tháng/năm hiện tại nếu không truyền
        const currentThang = parseInt(thang) || new Date().getMonth() + 1;
        const currentNam = parseInt(nam) || new Date().getFullYear();

        const statisticalService = new StatisticalService(pool);
        const stats = await statisticalService.getBacSiStats(currentThang, currentNam);
        return res.status(200).json({
            success: true,
            data: stats,
            filters: { thang: currentThang, nam: currentNam } // Thêm info filter cho frontend
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ StatisticalService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy thống kê bác sĩ'));
    }
};