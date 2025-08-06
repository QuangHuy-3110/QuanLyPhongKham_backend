const DoctorService = require('../services/doctor.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const doctorService = new DoctorService(pool);
        const document = await doctorService.addDoctor(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ DoctorService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm bác sĩ'));
    }
};

exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const doctorService = new DoctorService(pool);    
        const { cccdBS, tenBS, sdtBS, emailBS, soCCHN, xoa } = req.query;
        const filter = {};
        
        // Build filter object based on provided query parameters
        if (cccdBS) filter.cccdBS = cccdBS;
        if (tenBS) filter.tenBS = tenBS;
        if (sdtBS) filter.sdtBS = sdtBS;
        if (emailBS) filter.emailBS = emailBS;
        if (soCCHN) filter.soCCHN = soCCHN;
        if (xoa) filter.xoa = xoa;

        documents = await doctorService.find(filter);
        return res.send(documents); 
    } catch (error) {
        // Truyền lỗi trực tiếp từ DoctorService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách bác sĩ'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const doctorService = new DoctorService(pool);    
        const document = await doctorService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Doctor not found'));
        }
        return res.send(document);  
    } catch (error) {
        // Truyền lỗi trực tiếp từ DoctorService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin bác sĩ với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const doctorService = new DoctorService(pool);
        const document = await doctorService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Doctor not found'));
        }
        return res.send({message: 'Doctor was updated successfully'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ DoctorService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật bác sĩ với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const doctorService = new DoctorService(pool);
        const document = await doctorService.delete(req.params.id);
        if (!document) {    
            return next(new ApiError(404, 'Doctor not found'));
        }
        return res.send({message: 'Doctor was deleted successfully'}); 
    } catch (error) {
        // Truyền lỗi trực tiếp từ DoctorService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa bác sĩ với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const doctorService = new DoctorService(pool);
        const deletedCount = await doctorService.deleteAll();
        return res.send({
            message: `${deletedCount} Doctor were deleted successfully`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ DoctorService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả bác sĩ'));
    }
};