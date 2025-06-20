const SpecialtiesService = require('../services/specialties.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const document = await specialtiesService.addSpecialties(req.body);
        return res.send(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next (
            new ApiError(500, "An error occurred while creating the record"
            )
        );
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
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                error.statusCode || 500,
                error.message || 'Lỗi khi tìm kiếm chuyên khoa'
            )
        );
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const document = await specialtiesService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Specialties not found'));
        }
        return res.send(document);  
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(    
            new ApiError(
                500,    
                `Error occurred while retrieving record with id=${req.params.id}`
            )
        );
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
            return next(new ApiError(404, 'Specialties not found'));
        }
        return res.send({message: 'Specialties was updated successfully'});
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while updating specialties with id=${req.params.id}`
            )
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const deletedCount = await specialtiesService.delete(req.params.id);
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Specialties not found'));
        }
        return res.send({
            message: 'Specialties was deleted successfully'
        });
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while deleting specialties with id=${req.params.id}`
            )
        );  
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const specialtiesService = new SpecialtiesService(pool);
        const deletedCount = await specialtiesService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No specialties found to delete'));
        }
        return res.send({
            message: `${deletedCount} specialties were deleted successfully`
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(    
            new ApiError(
                500, 
                'Error occurred while deleting all specialties'
            )
        );
    }
};