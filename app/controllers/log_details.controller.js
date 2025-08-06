const Log_detailsService = require('../services/log_details.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const log_detailsService = new Log_detailsService(pool);
        const document = await log_detailsService.addLog_detail(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ Log_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm chi tiết nhật ký đặt hàng'));
    }
}

exports.findAll = async (req, res, next) => {
    try {
        const log_detailsService = new Log_detailsService(pool);
        const filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maNK) {
            filter.maNK = req.query.maNK;
        }
        if (req.query.maThuoc) {
            filter.maThuoc = req.query.maThuoc;
        }
        if (req.query.soluong) {
            filter.soluong = req.query.soluong;
        }
        if (req.query.donvitinh) {
            filter.donvitinh = req.query.donvitinh;
        }

        // Gọi hàm find với bộ lọc
        const documents = await log_detailsService.find(filter);

        return res.status(200).json(documents);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm chi tiết nhật ký đặt hàng:', error);
        // Truyền lỗi trực tiếp từ Log_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách chi tiết nhật ký đặt hàng'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { maNK } = req.params; // Lấy maNK từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const log_detailsService = new Log_detailsService(pool);

        // Kiểm tra xem maNK và maThuoc có được cung cấp không
        if (!maNK || !maThuoc) {
            return next(new ApiError(400, 'maNK và maThuoc là bắt buộc'));
        }

        // Gọi hàm findById với đối tượng chứa maNK và maThuoc
        const document = await log_detailsService.findById({ maNK, maThuoc });

        // Kiểm tra kết quả
        if (!document) {
            return next(new ApiError(404, `Chi tiết nhật ký đặt hàng với maNK=${maNK} và maThuoc=${maThuoc} không tìm thấy`));
        }

        return res.status(200).json(document);
    } catch (error) {
        console.error(`Lỗi khi tìm kiếm chi tiết nhật ký đặt hàng với maNK=${req.params.maNK}, maThuoc=${req.query.maThuoc}:`, error);
        // Truyền lỗi trực tiếp từ Log_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin chi tiết nhật ký đặt hàng với maNK=${req.params.maNK} và maThuoc=${req.query.maThuoc}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const { maNK } = req.params; // Lấy maNK từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const log_detailsService = new Log_detailsService(pool);

        // Kiểm tra xem maNK và maThuoc có được cung cấp không
        if (!maNK || !maThuoc) {
            return next(new ApiError(400, 'maNK và maThuoc là bắt buộc'));
        }
        const document = await log_detailsService.update({maNK, maThuoc}, req.body);
        if (!document) {
            return next(new ApiError(404, 'Chi tiết nhật ký đặt hàng không tìm thấy'));
        }
        return res.send({message: 'Chi tiết nhật ký đặt hàng được cập nhật thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ Log_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật chi tiết nhật ký đặt hàng với maNK=${req.params.maNK} và maThuoc=${req.query.maThuoc}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { maNK } = req.params; // Lấy maNK từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const log_detailsService = new Log_detailsService(pool);
        // Kiểm tra xem maNK và maThuoc có được cung cấp không 
        if (!maNK || !maThuoc) {
            return next(new ApiError(400, 'maNK và maThuoc là bắt buộc'));
        }
        const deletedCount = await log_detailsService.delete({ maNK, maThuoc });
        if (deletedCount === 0) {
            return next(new ApiError(404, `Chi tiết nhật ký đặt hàng với maNK=${maNK} và maThuoc=${maThuoc} không tìm thấy`));
        }
        return res.send({
            message: `Chi tiết nhật ký đặt hàng với maNK=${maNK} và maThuoc=${maThuoc} được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ Log_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa chi tiết nhật ký đặt hàng với maNK=${req.params.maNK} và maThuoc=${req.query.maThuoc}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const log_detailsService = new Log_detailsService(pool);
        const deletedCount = await log_detailsService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không tìm thấy chi tiết nhật ký đặt hàng để xóa'));
        }   
        return res.send({
            message: `${deletedCount} chi tiết nhật ký đặt hàng được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ Log_detailsService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả chi tiết nhật ký đặt hàng'));
    }
};