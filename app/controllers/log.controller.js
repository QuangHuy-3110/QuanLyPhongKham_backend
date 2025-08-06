const LogService = require('../services/log.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const logService = new LogService(pool);
        const document = await logService.addLog(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ LogService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm nhật ký đặt hàng'));
    }
}

exports.findAll = async (req, res, next) => {
    try {
        const logService = new LogService(pool);
        let filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maNK) {
            filter.maNK = req.query.maNK;
        }
        if (req.query.ngaygoi) {
            filter.ngaygoi = req.query.ngaygoi;
        }
        // Gọi hàm find với bộ lọc
        const documents = await logService.find(filter);
        return res.status(200).json(documents);
    } catch (error) {
        // Truyền lỗi trực tiếp từ LogService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách nhật ký đặt hàng'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }   
        const logService = new LogService(pool);
        const document = await logService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Nhật ký đặt hàng không tìm thấy'));
        }
        return res.send(document);  
    } catch (error) {
        // Truyền lỗi trực tiếp từ LogService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin nhật ký đặt hàng với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }
        const logService = new LogService(pool);
        const document = await logService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Nhật ký đặt hàng không tìm thấy'));
        }
        return res.send({message: 'Nhật ký đặt hàng được cập nhật thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ LogService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật nhật ký đặt hàng với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }
        const logService = new LogService(pool);
        const document = await logService.delete(req.params.id);       
        if (!document) {    
            return next(new ApiError(404, 'Nhật ký đặt hàng không tìm thấy'));
        }
        return res.send({message: 'Nhật ký đặt hàng được xóa thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ LogService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa nhật ký đặt hàng với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const logService = new LogService(pool);
        const deletedCount = await logService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không tìm thấy nhật ký đặt hàng để xóa'));
        }
        return res.send({
            message: `${deletedCount} nhật ký đặt hàng được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ LogService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả nhật ký đặt hàng'));
    }
};