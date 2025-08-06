const PrescriptionService = require('../services/prescription.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const prescriptionService = new PrescriptionService(pool);
        const document = await prescriptionService.addPrescription(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ PrescriptionService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm toa thuốc'));
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
        // Truyền lỗi trực tiếp từ PrescriptionService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách toa thuốc'));
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
        console.error(`Lỗi khi tìm kiếm toa thuốc với maLanKham=${req.params.maLanKham}, maThuoc=${req.query.maThuoc}:`, error);
        // Truyền lỗi trực tiếp từ PrescriptionService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin toa thuốc với maLanKham=${req.params.maLanKham} và maThuoc=${req.query.maThuoc}`));
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
            return next(new ApiError(404, 'Toa thuốc không tìm thấy'));
        }
        return res.send({message: 'Toa thuốc được cập nhật thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ PrescriptionService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật toa thuốc với maLanKham=${req.params.maLanKham} và maThuoc=${req.query.maThuoc}`));
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
            return next(new ApiError(404, `Toa thuốc với maLanKham=${maLanKham} và maThuoc=${maThuoc} không tìm thấy`));
        }
        return res.send({
            message: `Toa thuốc với maLanKham=${maLanKham} và maThuoc=${maThuoc} được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ PrescriptionService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa toa thuốc với maLanKham=${req.params.maLanKham} và maThuoc=${req.query.maThuoc}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const prescriptionService = new PrescriptionService(pool);
        const deletedCount = await prescriptionService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không tìm thấy toa thuốc để xóa'));
        }   
        return res.send({
            message: `${deletedCount} toa thuốc được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ PrescriptionService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả toa thuốc'));
    }
};