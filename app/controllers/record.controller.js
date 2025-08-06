const RecordService = require('../services/record.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const recordService = new RecordService(pool);
        const document = await recordService.addRecord(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ RecordService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm hồ sơ bệnh án'));
    }
}

exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const recordService = new RecordService(pool);
        const { maBN, ngaylapHS, xoa } = req.query;
        if (maBN) {
            documents = await recordService.findByMaBN(maBN);
        } else if (ngaylapHS) {
            documents = await recordService.find({ ngaylapHS });
        } else if (xoa) {
            documents = await recordService.find({ xoa });
        } else {
            documents = await recordService.find({});
        }
        return res.send(documents); 
    } catch (error) {
        // Truyền lỗi trực tiếp từ RecordService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách hồ sơ bệnh án'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const recordService = new RecordService(pool);
        const document = await recordService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Hồ sơ bệnh án không tìm thấy'));
        }
        return res.send(document);  
    } catch (error) {
        // Truyền lỗi trực tiếp từ RecordService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin hồ sơ bệnh án với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        if (!req.body.maBN || !req.body.ngaylapHS) {
            return next(new ApiError(400, 'maBN và ngaylapHS là bắt buộc'));
        }
        const recordService = new RecordService(pool);
        const document = await recordService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Hồ sơ bệnh án không tìm thấy'));
        }
        return res.send({message: 'Hồ sơ bệnh án được cập nhật thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ RecordService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật hồ sơ bệnh án với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }       
        const recordService = new RecordService(pool);
        const document = await recordService.delete(req.params.id);
        if (!document) {    
            return next(new ApiError(404, 'Hồ sơ bệnh án không tìm thấy'));
        }
        return res.send({message: 'Hồ sơ bệnh án được xóa thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ RecordService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa hồ sơ bệnh án với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const recordService = new RecordService(pool);
        const deletedCount = await recordService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không tìm thấy hồ sơ bệnh án để xóa'));
        }
        return res.send({
            message: `${deletedCount} hồ sơ bệnh án được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ RecordService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả hồ sơ bệnh án'));
    }
};