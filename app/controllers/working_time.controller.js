const WorkingTimeService = require('../services/working_time.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const workingtimeService = new WorkingTimeService(pool);
        const document = await workingtimeService.addWorkingTime(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ WorkingTimeService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi thêm thời gian làm việc: ${error.message}`));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const workingtimeService = new WorkingTimeService(pool);
        const filter = {};
        if (req.query.maBS) {
            filter.maBS = req.query.maBS;
        }
        if (req.query.ngaythangnam) {
            filter.ngaythangnam = req.query.ngaythangnam;
        }
        const documents = await workingtimeService.find(filter);
        return res.status(200).json(documents);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm thời gian làm việc:', error);
        // Truyền lỗi trực tiếp từ WorkingTimeService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy danh sách thời gian làm việc: ${error.message}`));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { maBS } = req.params;
        const { ngaythangnam, giobatdau } = req.query;
        const workingtimeService = new WorkingTimeService(pool);
        if (!maBS || !ngaythangnam || !giobatdau) {
            return next(new ApiError(400, 'maBS, ngaythangnam và giobatdau là bắt buộc'));
        }
        const document = await workingtimeService.findById({ maBS, ngaythangnam, giobatdau });
        if (!document) {
            return next(new ApiError(404, 'Thời gian làm việc không tìm thấy'));
        }
        return res.status(200).json(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ WorkingTimeService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin thời gian làm việc với maBS=${req.query.maBS}, ngaythangnam=${req.query.ngaythangnam}, giobatdau=${req.query.giobatdau}: ${error.message}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const { maBS } = req.params;
        const { ngaythangnam, giobatdau } = req.query;
        const workingtimeService = new WorkingTimeService(pool);
        if (!maBS || !ngaythangnam || !giobatdau) {
            return next(new ApiError(400, 'maBS, ngaythangnam và giobatdau là bắt buộc'));
        }
        const document = await workingtimeService.update({ maBS, ngaythangnam, giobatdau }, req.body);
        if (!document) {
            return next(new ApiError(404, 'Thời gian làm việc không tìm thấy'));
        }
        return res.status(200).json(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ WorkingTimeService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật thời gian làm việc với maBS=${req.query.maBS}, ngaythangnam=${req.query.ngaythangnam}, giobatdau=${req.query.giobatdau}: ${error.message}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { maBS } = req.params;
        const { ngaythangnam, giobatdau } = req.query;
        const workingtimeService = new WorkingTimeService(pool);
        if (!maBS || !ngaythangnam || !giobatdau) {
            return next(new ApiError(400, 'maBS, ngaythangnam và giobatdau là bắt buộc'));
        }
        const deletedCount = await workingtimeService.delete({ maBS, ngaythangnam, giobatdau });
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Thời gian làm việc không tìm thấy'));
        }
        return res.status(200).json({
            message: 'Thời gian làm việc được xóa thành công'
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ WorkingTimeService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa thời gian làm việc với maBS=${req.query.maBS}, ngaythangnam=${req.query.ngaythangnam}, giobatdau=${req.query.giobatdau}: ${error.message}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const workingtimeService = new WorkingTimeService(pool);
        const deletedCount = await workingtimeService.deleteAll();
        return res.status(200).json({
            message: `${deletedCount} thời gian làm việc được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ WorkingTimeService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa tất cả thời gian làm việc: ${error.message}`));
    }
};