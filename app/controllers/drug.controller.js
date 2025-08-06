const DrugService = require('../services/drug.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const drugService = new DrugService(pool);
        const document = await drugService.addDrug(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ DrugService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm thuốc'));
    }
}

exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const drugService = new DrugService(pool);
        const { name, xoa, maNPP } = req.query;
        const filter = {};
        if (name) {
            documents = await drugService.findByName(name);
            return res.send(documents);
        } 
        if (xoa) {
            filter.xoa = xoa;
        }
        if (maNPP) {
            filter.maNPP = maNPP;
        }
        documents = await drugService.find(filter);
        return res.send(documents); 
    } catch (error) {
        // Truyền lỗi trực tiếp từ DrugService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách thuốc'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const drugService = new DrugService(pool);
        const document = await drugService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Drug not found'));
        }
        return res.send(document);  
    } catch (error) {
        // Truyền lỗi trực tiếp từ DrugService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin thuốc với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const drugService = new DrugService(pool);
        const document = await drugService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Drug not found'));
        }
        return res.send({message: 'Drug was updated successfully'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ DrugService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật thuốc với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const drugService = new DrugService(pool);
        const document = await drugService.delete(req.params.id);
        if (!document) {    
            return next(new ApiError(404, 'Drug not found'));
        }
        return res.send({message: 'Drug was deleted successfully'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ DrugService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa thuốc với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const drugService = new DrugService(pool);
        const deletedCount = await drugService.deleteAll();
        return res.send({
            message: `${deletedCount} Drugs were deleted successfully`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ DrugService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả thuốc'));
    }
};