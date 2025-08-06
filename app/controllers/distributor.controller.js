const DistributorService = require('../services/distributor.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const distributorService = new DistributorService(pool);
        const document = await distributorService.addDistributor(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ DistributorService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm nhà phân phối'));
    }
}

exports.findAll = async (req, res, next) => {
    try {
        const distributorService = new DistributorService(pool);
        let filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.tenNPP) {
            filter.tenNPP = req.query.tenNPP;
        }
        if (req.query.diachiNPP) {
            filter.diachiNPP = req.query.diachiNPP;
        }
        if (req.query.sdtNPP) {
            filter.sdtNPP = req.query.sdtNPP;
        }
        if (req.query.emailNPP) {
            filter.emailNPP = req.query.emailNPP;
        }
        if (req.query.stkNPP) {
            filter.stkNPP = req.query.stkNPP;
        }
        if (req.query.nganhangNPP) {
            filter.nganhangNPP = req.query.nganhangNPP;
        }
        if (req.query.xoa) {
            filter.xoa = req.query.xoa; 
        }

        // Gọi hàm find với bộ lọc
        const documents = await distributorService.find(filter);
        return res.status(200).json(documents);
    } catch (error) {
        // Truyền lỗi trực tiếp từ DistributorService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách nhà phân phối'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }   
        const distributorService = new DistributorService(pool);
        const document = await distributorService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'distributor not found'));
        }
        return res.send(document);  
    } catch (error) {
        // Truyền lỗi trực tiếp từ DistributorService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin nhà phân phối với id=${req.params.id}`));
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
        const distributorService = new DistributorService(pool);
        const document = await distributorService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'distributor not found'));
        }
        return res.send({message: 'distributor was updated successfully'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ DistributorService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật nhà phân phối với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }
        const distributorService = new DistributorService(pool);
        const document = await distributorService.delete(req.params.id);       
        if (!document) {    
            return next(new ApiError(404, 'distributor not found'));
        }
        return res.send({message: 'distributor was deleted successfully'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ DistributorService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa nhà phân phối với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const distributorService = new DistributorService(pool);
        const deletedCount = await distributorService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No records found to delete'));
        }
        return res.send({
            message: `${deletedCount} distributors were deleted successfully`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ DistributorService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả nhà phân phối'));
    }
};