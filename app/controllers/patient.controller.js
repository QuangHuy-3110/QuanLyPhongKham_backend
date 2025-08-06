const PatientService = require('../services/patient.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const patientService = new PatientService(pool);        
        const document = await patientService.addPatient(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ PatientService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm bệnh nhân'));
    }
}

exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const patientService = new PatientService(pool);
        const { cccdBN, tendangnhapBN, xoa } = req.query;
        
        // Tạo bộ lọc dựa trên các thuộc tính được cung cấp
        const filter = {};
        if (cccdBN) filter.cccdBN = cccdBN;
        if (tendangnhapBN) filter.tendangnhapBN = tendangnhapBN;
        if (xoa) filter.xoa = xoa;

        // Gọi phương thức find với bộ lọc
        documents = await patientService.find(filter);
        
        return res.send(documents);
    } catch (error) {
        // Truyền lỗi trực tiếp từ PatientService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách bệnh nhân'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const patientService = new PatientService(pool);    
        const document = await patientService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Patient not found'));
        }
        return res.send(document);  
    } catch (error) {
        // Truyền lỗi trực tiếp từ PatientService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin bệnh nhân với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const patientService = new PatientService(pool);
        const document = await patientService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Patient not found'));
        }
        return res.send({message: 'Patient was updated successfully'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ PatientService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật bệnh nhân với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const patientService = new PatientService(pool);
        const document = await patientService.delete(req.params.id);
        if (!document) {    
            return next(new ApiError(404, 'Patient not found'));
        }
        return res.send({message: 'Patient was deleted successfully'}); 
    } catch (error) {
        // Truyền lỗi trực tiếp từ PatientService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa bệnh nhân với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const patientService = new PatientService(pool);
        const deletedCount = await patientService.deleteAll();
        return res.send({
            message: `${deletedCount} patients were deleted successfully`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ PatientService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả bệnh nhân'));
    }
};