const DoctorRoleService = require('../services/doctor_role.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const doctor_roleService = new DoctorRoleService(pool);
        const document = await doctor_roleService.addDoctorRole(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ DoctorRoleService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm mối quan hệ bác sĩ - chuyên khoa'));
    }
}

exports.findAll = async (req, res, next) => {
    try {
        const doctor_roleService = new DoctorRoleService(pool);
        // Tạo một đối tượng filter để chứa các điều kiện tìm kiếm
        const filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maBS) {
            filter.maBS = req.query.maBS;
        }
        if (req.query.maCK) {
            filter.maCK = req.query.maCK;
        }
        
        // Gọi hàm find với bộ lọc
        const documents = await doctor_roleService.find(filter);

        return res.status(200).json(documents);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm mối quan hệ bác sĩ - chuyên khoa:', error);
        // Truyền lỗi trực tiếp từ DoctorRoleService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách mối quan hệ bác sĩ - chuyên khoa'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { maBS } = req.params; // Lấy maBS từ URL path
        const { maCK } = req.query; // Lấy maCK từ querys
        const doctor_roleService = new DoctorRoleService(pool);

        // Kiểm tra xem maBS và maCK có được cung cấp không
        if (!maBS || !maCK) {
            return next(new ApiError(400, 'maBS và maCK là bắt buộc'));
        }

        // Gọi hàm findById với đối tượng chứa maBS và maCK
        const document = await doctor_roleService.findById({ maBS, maCK });

        if (!document) {
            return next(new ApiError(404, 'Không tìm thấy mối quan hệ bác sĩ - chuyên khoa'));
        }

        return res.status(200).json(document);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm mối quan hệ bác sĩ - chuyên khoa:', error);
        // Truyền lỗi trực tiếp từ DoctorRoleService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin mối quan hệ bác sĩ - chuyên khoa với maBS=${req.params.maBS} và maCK=${req.query.maCK}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const { maBS } = req.params; // Lấy maBS từ URL path
        const { maCK } = req.query; // Lấy maCK từ querys
        const doctor_roleService = new DoctorRoleService(pool);

        // Kiểm tra xem maBS và maCK có được cung cấp không
        if (!maBS || !maCK) {
            return next(new ApiError(400, 'maBS và maCK là bắt buộc'));
        }

        // Gọi hàm update với đối tượng chứa maBS, maCK và payload
        const updatedDocument = await doctor_roleService.update({ maBS, maCK }, req.body);

        if (!updatedDocument) {
            return next(new ApiError(404, 'Không tìm thấy mối quan hệ bác sĩ - chuyên khoa để cập nhật'));
        }

        return res.status(200).json(updatedDocument);
    } catch (error) {
        console.error('Lỗi khi cập nhật mối quan hệ bác sĩ - chuyên khoa:', error);
        // Truyền lỗi trực tiếp từ DoctorRoleService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật mối quan hệ bác sĩ - chuyên khoa với maBS=${req.params.maBS} và maCK=${req.query.maCK}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { maBS } = req.params; // Lấy maBS từ URL path
        const { maCK } = req.query; // Lấy maCK từ querys
        const doctor_roleService = new DoctorRoleService(pool);

        // Kiểm tra xem maBS và maCK có được cung cấp không
        if (!maBS || !maCK) {
            return next(new ApiError(400, 'maBS và maCK là bắt buộc'));
        }

        // Gọi hàm delete với đối tượng chứa maBS và maCK
        const deletedCount = await doctor_roleService.delete({ maBS, maCK });

        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không tìm thấy mối quan hệ bác sĩ - chuyên khoa để xóa'));
        }

        return res.status(200).json({
            message: `Mối quan hệ bác sĩ - chuyên khoa đã được xóa thành công`
        });
    } catch (error) {
        console.error('Lỗi khi xóa mối quan hệ bác sĩ - chuyên khoa:', error);
        // Truyền lỗi trực tiếp từ DoctorRoleService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa mối quan hệ bác sĩ - chuyên khoa với maBS=${req.params.maBS} và maCK=${req.query.maCK}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const doctor_roleService = new DoctorRoleService(pool);
        const deletedCount = await doctor_roleService.deleteAll();

        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không có mối quan hệ bác sĩ - chuyên khoa nào để xóa'));
        }

        return res.status(200).json({
            message: `${deletedCount} mối quan hệ bác sĩ - chuyên khoa đã được xóa thành công`
        });
    } catch (error) {
        console.error('Lỗi khi xóa tất cả mối quan hệ bác sĩ - chuyên khoa:', error);
        // Truyền lỗi trực tiếp từ DoctorRoleService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả mối quan hệ bác sĩ - chuyên khoa'));
    }
};