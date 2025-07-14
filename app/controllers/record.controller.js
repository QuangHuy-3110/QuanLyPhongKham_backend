const RecordService = require('../services/record.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const recordService = new RecordService(pool);
        const document = await recordService.addRecord(req.body);
        return res.send(document);
    } catch (error) {
        return next (
            new ApiError(500, "An error occurred while creating the record")
        );
    }
}

exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const recordService = new RecordService(pool);
        const { maBN, ngaylapHS, xoa } = req.query;
        if (maBN) {
            documents = await recordService.findByMaBN(maBN);
        } else if (ngaylapHS) {
            documents = await recordService.find({ ngaylapHS });
        } else if (xoa) {
            documents = await recordService.find({ xoa });
        }
        else {
            documents = await recordService.find({});
        }
    } catch (error) {
        return next(
            new ApiError(500, 'An error occurred while retrieving records')
        );
    }
    return res.send(documents); 
};

exports.findOne = async (req, res, next) => {
    try {
        const recordService = new RecordService(pool);
        const document = await recordService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Record not found'));
        }
        return res.send(document);  
    } catch (error) {
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
        if (!req.body.maBN || !req.body.ngaylapHS) {
            return next(new ApiError(400, 'maBN and ngaylapHS are required'));
        }
        const recordService = new RecordService(pool);
        const document = await recordService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Record not found'));
        }
        return res.send({message: 'Record was updated successfully'});
    } catch (error) {
        return next(
            new ApiError(
                500,    
                `Error occurred while updating record with id=${req.params.id}`
            )
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }       
        const recordService = new RecordService(pool);
        const document = await recordService.delete(req.params.id);
        if (!document) {    
            return next(new ApiError(404, 'Record not found'));
        }
        return res.send({message: 'Record was deleted successfully'});
    }
    catch (error) {
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
        const recordService = new RecordService(pool);
        const deletedCount = await recordService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No records found to delete'));
        }
        return res.send({
            message: `${deletedCount} records were deleted successfully`
        });
    } catch (error) {
        return next(    
            new ApiError(
                500, 
                'An error occurred while deleting records'
            )
        );
    }
};