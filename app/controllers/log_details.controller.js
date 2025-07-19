const Log_detailsService = require('../services/log_details.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const log_detailsService = new Log_detailsService(pool);
        const document = await log_detailsService.addLog_detail(req.body);
        return res.send(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next (
            new ApiError(500, "An error occurred while creating the log_details")
        );
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
        console.error('Lỗi khi tìm kiếm log_details:', error);
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                error.statusCode || 500,
                error.message || 'Lỗi khi tìm kiếm log_details'
            )
        );
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { maNK } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const log_detailsService = new Log_detailsService(pool);

        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không
        if (!maNK || !maThuoc) {
            return next(new ApiError(400, 'maNK và maThuoc là bắt buộc'));
        }

        // Gọi hàm findById với đối tượng chứa maLanKham và maThuoc
        const document = await log_detailsService.findById({ maNK, maThuoc });

        // Kiểm tra kết quả
        if (!document) {
            return next(new ApiError(404, `Nhật kí đặt hàng với maNK=${maNK} và maThuoc=${maThuoc} không tìm thấy`));
        }

        return res.status(200).json(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        console.error(`Lỗi khi tìm kiếm Nhật kí đặt hàng với maNK=${req.query.maNK}, maThuoc=${req.query.maThuoc}:`, error);
        return next(
            new ApiError(
                error.statusCode || 500,
                error.message || `Lỗi khi tìm kiếm Nhật kí đặt hàng với maNK=${req.query.maNK} và maThuoc=${req.query.maThuoc}`
            )
        );
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const { maNK } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const log_detailsService = new Log_detailsService(pool);

        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không
        if (!maNK || !maThuoc) {
            return next(new ApiError(400, 'maNK và maThuoc là bắt buộc'));
        }
        const document = await log_detailsService.update({maNK, maThuoc}, req.body);
        if (!document) {
            return next(new ApiError(404, 'log_details not found'));
        }
        return res.send({message: 'log_details was updated successfully'});
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                'Error occurred while updating log_details with maNK=' + maNK + ' and maThuoc=' + maThuoc
            )
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { maNK } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const log_detailsService = new Log_detailsService(pool);
        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không 
        if (!maNK || !maThuoc) {
            return next(new ApiError(400, 'maNK và maThuoc là bắt buộc'));
        }
        const deletedCount = await log_detailsService.delete({ maNK, maThuoc });
        if (deletedCount === 0) {
            return next(new ApiError(404, `log_details with maNK=${maNK} and maThuoc=${maThuoc} not found`));
        }
        return res.send({
            message: `log_details with maNK=${maNK} and maThuoc=${maThuoc} was deleted successfully`
        });
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while deleting maNK with id=${req.params.id}`
            )
        );  
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const log_detailsService = new Log_detailsService(pool);
        const deletedCount = await log_detailsService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No log_details found to delete'));
        }   
        return res.send({
            message: `${deletedCount} log_details were deleted successfully`
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(    
            new ApiError(
                500, 
                'An error occurred while deleting log_details'
            )
        );
    }
};