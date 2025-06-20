const PrescriptionService = require('../services/prescription.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const prescriptionService = new PrescriptionService(pool);
        const document = await prescriptionService.addPrescription(req.body);
        return res.send(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next (
            new ApiError(500, "An error occurred while creating the prescription")
        );
    }
}

exports.findAll = async (req, res, next) => {
    try {
        const prescriptionService = new PrescriptionService(pool);
        const filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maLanKham) {
            filter.maLanKham = req.query.maLanKham;
        }
        if (req.query.maThuoc) {
            filter.maThuoc = req.query.maThuoc;
        }
        if (req.query.lieuluong) {
            filter.lieuluong = req.query.lieuluong;
        }

        // Gọi hàm find với bộ lọc
        const documents = await prescriptionService.find(filter);

        return res.status(200).json(documents);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm toa thuốc:', error);
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                error.statusCode || 500,
                error.message || 'Lỗi khi tìm kiếm toa thuốc'
            )
        );
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { maLanKham } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const prescriptionService = new PrescriptionService(pool);

        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không
        if (!maLanKham || !maThuoc) {
            return next(new ApiError(400, 'maLanKham và maThuoc là bắt buộc'));
        }

        // Gọi hàm findById với đối tượng chứa maLanKham và maThuoc
        const document = await prescriptionService.findById({ maLanKham, maThuoc });

        // Kiểm tra kết quả
        if (!document) {
            return next(new ApiError(404, `Toa thuốc với maLanKham=${maLanKham} và maThuoc=${maThuoc} không tìm thấy`));
        }

        return res.status(200).json(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        console.error(`Lỗi khi tìm kiếm toa thuốc với maLanKham=${req.query.maLanKham}, maThuoc=${req.query.maThuoc}:`, error);
        return next(
            new ApiError(
                error.statusCode || 500,
                error.message || `Lỗi khi tìm kiếm toa thuốc với maLanKham=${req.query.maLanKham} và maThuoc=${req.query.maThuoc}`
            )
        );
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const { maLanKham } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const prescriptionService = new PrescriptionService(pool);

        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không
        if (!maLanKham || !maThuoc) {
            return next(new ApiError(400, 'maLanKham và maThuoc là bắt buộc'));
        }
        const document = await prescriptionService.update({maLanKham, maThuoc}, req.body);
        if (!document) {
            return next(new ApiError(404, 'Prescription not found'));
        }
        return res.send({message: 'Prescription was updated successfully'});
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                'Error occurred while updating prescription with maLanKham=' + maLanKham + ' and maThuoc=' + maThuoc
            )
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { maLanKham } = req.params; // Lấy maLanKham từ URL path
        const { maThuoc } = req.query; // Lấy maThuoc từ query
        const prescriptionService = new PrescriptionService(pool);
        // Kiểm tra xem maLanKham và maThuoc có được cung cấp không 
        if (!maLanKham || !maThuoc) {
            return next(new ApiError(400, 'maLanKham và maThuoc là bắt buộc'));
        }
        const deletedCount = await prescriptionService.delete({ maLanKham, maThuoc });
        if (deletedCount === 0) {
            return next(new ApiError(404, `Prescription with maLanKham=${maLanKham} and maThuoc=${maThuoc} not found`));
        }
        return res.send({
            message: `Prescription with maLanKham=${maLanKham} and maThuoc=${maThuoc} was deleted successfully`
        });
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while deleting record with id=${req.params.id}`
            )
        );  
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const PrescriptionService = new PrescriptionService(pool);
        const deletedCount = await PrescriptionService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No prescriptions found to delete'));
        }   
        return res.send({
            message: `${deletedCount} prescriptions were deleted successfully`
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(    
            new ApiError(
                500, 
                'An error occurred while deleting prescriptions'
            )
        );
    }
};