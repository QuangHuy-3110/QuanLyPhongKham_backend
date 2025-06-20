const WorkingTimeService = require('../services/working_time.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const workingtimeService = new WorkingTimeService(pool);
        const document = await workingtimeService.addWorkingTime(req.body);
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
        const workingtimeService = new WorkingTimeService(pool);
        const filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maBS) {
            filter.maBS = req.query.maBS;
        }
        if (req.query.ngaythangnam) {
            filter.ngaythangnam = req.query.ngaythangnam;
        }

        // Gọi hàm find với bộ lọc
        const documents = await workingtimeService.find(filter);
        return res.status(200).json(documents);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm thời gian làm việc:', error);
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                error.statusCode || 500,
                error.message || 'Lỗi khi tìm kiếm thời gian làm việc'
            )
        );
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const { maBS } = req.params;
        const { ngaythangnam, giobatdau } = req.query; 
        const workingtimeService = new WorkingTimeService(pool);
        // Kiểm tra xem maBS, ngaythangnam và giobatdau có được cung cấp không
        if (!maBS || !ngaythangnam || !giobatdau) {
            return next(new ApiError(400, 'maBS, ngaythangnam và giobatdau là bắt buộc'));
        }
        // Gọi hàm findById với đối tượng chứa maBS, ngaythangnam và giobatdau
        const document = await workingtimeService.findById({ maBS, ngaythangnam, giobatdau });
        if (!document) {
            return next(new ApiError(404, 'Working time not found'));
        }
        return res.status(200).json(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                'Error occurred while retrieving working time with maBS=' + req.query.maBS + ', ngaythangnam=' + req.query.ngaythangnam + ' and giobatdau=' + req.query.giobatdau
            )
        );
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const { maBS } = req.params;
        const { ngaythangnam, giobatdau } = req.query; 
        const workingtimeService = new WorkingTimeService(pool);
        // Kiểm tra xem maBS, ngaythangnam và giobatdau có được cung cấp không  
        if (!maBS || !ngaythangnam || !giobatdau) {
            return next(new ApiError(400, 'maBS, ngaythangnam và giobatdau là bắt buộc'));
        }
        const document = await workingtimeService.update({ maBS, ngaythangnam, giobatdau }, req.body);
        if (!document) {
            return next(new ApiError(404, 'Working time not found'));
        }
        return res.status(200).json(document);

    }catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                'Error occurred while updating working time with maBS=' + req.query.maBS + ', ngaythangnam=' + req.query.ngaythangnam + ' and giobatdau=' + req.query.giobatdau
            )
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        const { maBS } = req.params;
        const { ngaythangnam, giobatdau } = req.query; 
        const workingtimeService = new WorkingTimeService(pool);
        // Kiểm tra xem maBS, ngaythangnam và giobatdau có được cung cấp không  
        if (!maBS || !ngaythangnam || !giobatdau) {
            return next(new ApiError(400, 'maBS, ngaythangnam và giobatdau là bắt buộc'));
        }
        const deletedCount = await workingtimeService.delete({ maBS, ngaythangnam, giobatdau });
        if (deletedCount === 0) {
            return next(new ApiError(404, 'Working time not found'));
        }
        return res.status(200).json({
            message: 'Working time was deleted successfully'
        });
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                'Error occurred while deleting working time with maBS=' + req.query.maBS + ', ngaythangnam=' + req.query.ngaythangnam + ' and giobatdau=' + req.query.giobatdau
            )
        );
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const workingtimeService = new WorkingTimeService(pool);
        const deletedCount = await workingtimeService.deleteAll();
        return res.status(200).json({
            message: `${deletedCount} working times were deleted successfully`
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                'Error occurred while deleting all working times'
            )
        );
    }
};