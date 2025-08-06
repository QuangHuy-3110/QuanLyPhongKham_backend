const SpecialtiesService = require('../services/specialties.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const document = await specialtiesService.addSpecialties(req.body);
        return res.send(document);
    } catch (error) {
        // Truyền lỗi trực tiếp từ SpecialtiesService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi thêm chuyên khoa'));
    }
}

exports.findAll = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        // Tạo một đối tượng filter để chứa các điều kiện tìm kiếm
        const filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.tenCK) {
            filter.tenCK = req.query.tenCK;
        }
        // Gọi hàm find với bộ lọc
        const documents = await specialtiesService.find(filter);

        return res.status(200).json(documents);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm chuyên khoa:', error);
        // Truyền lỗi trực tiếp từ SpecialtiesService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi lấy danh sách chuyên khoa'));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const document = await specialtiesService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Chuyên khoa không tìm thấy'));
        }
        return res.send(document);  
    } catch (error) {
        // Truyền lỗi trực tiếp từ SpecialtiesService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi lấy thông tin chuyên khoa với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const document = await specialtiesService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Chuyên khoa không tìm thấy'));
        }
        return res.send({message: 'Chuyên khoa được cập nhật thành công'});
    } catch (error) {
        // Truyền lỗi trực tiếp từ SpecialtiesService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi cập nhật chuyên khoa với id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const deletedCount = await specialtiesService.delete(req.params.id);
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Chuyên khoa không tìm thấy'));
        }
        return res.send({
            message: 'Chuyên khoa được xóa thành công'
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ SpecialtiesService
        return next(error instanceof ApiError ? error : new ApiError(500, `Lỗi khi xóa chuyên khoa với id=${req.params.id}`));
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const deletedCount = await specialtiesService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Không tìm thấy chuyên khoa để xóa'));
        }
        return res.send({
            message: `${deletedCount} chuyên khoa được xóa thành công`
        });
    } catch (error) {
        // Truyền lỗi trực tiếp từ SpecialtiesService
        return next(error instanceof ApiError ? error : new ApiError(500, 'Lỗi khi xóa tất cả chuyên khoa'));
    }
};