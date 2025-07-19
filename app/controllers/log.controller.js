const LogService = require('../services/log.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const logService = new LogService(pool);
        const document = await logService.addLog(req.body);
        return res.send(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next (
            new ApiError(500, "An error occurred while creating the log")
        );
    }
}

exports.findAll = async (req, res, next) => {
    // let documents = [];
    try {
        const logService = new LogService(pool);
        let filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maNK) {
            filter.maNK = req.query.maNK;
        }
        if (req.query.ngaygoi) {
            filter.ngaygoi = req.query.ngaygoi;
        }
        // Gọi hàm find với bộ lọc
        const documents = await logService.find(filter);
        // return res.send(documents);
        return res.status(200).json(documents);
    } catch (error) {
        return next(
            new ApiError(500, 'An error occurred while retrieving log')
        );
    }
     
};

exports.findOne = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }   
        const logService = new LogService(pool);
        const document = await logService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'log not found'));
        }
        return res.send(document);  
    } catch (error) {
        return next(    
            new ApiError(
                500,    
                `Error occurred while retrieving log with id=${req.params.id}`
            )
        );
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
        const logService = new LogService(pool);
        const document = await logService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'log not found'));
        }
        return res.send({message: 'log was updated successfully'});
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while updating log with id=${req.params.id}`
            )
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }
        const logService = new LogService(pool);
        const document = await logService.delete(req.params.id);       
        if (!document) {    
            return next(new ApiError(404, 'log not found'));
        }
        return res.send({message: 'log was deleted successfully'});
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while deleting log with id=${req.params.id}`
            )
        );  
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const logService = new LogService(pool);
        const deletedCount = await logService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No log found to delete'));
        }
        return res.send({
            message: `${deletedCount} log were deleted successfully`
        });
    } catch (error) {
        return next(    
            new ApiError(
                500, 
                'An error occurred while deleting log'
            )
        );
    }
};