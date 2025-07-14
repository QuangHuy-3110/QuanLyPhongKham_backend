const ExaminationService = require('../services/examination.sevice');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const examinationService = new ExaminationService(pool);
        const document = await examinationService.addExamination(req.body);
        return res.send(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next (
            new ApiError(500, "An error occurred while creating the examination")
        );
    }
}

exports.findAll = async (req, res, next) => {
    // let documents = [];
    try {
        const workingtimeService = new ExaminationService(pool);
        let filter = {};

        // Lấy bộ lọc từ query parameters
        if (req.query.maBS) {
            filter.maBS = req.query.maBS;
        }
        if (req.query.maHS) {
            filter.maHS = req.query.maHS;
        }
        if (req.query.ngaythangnam) {
            filter.ngaythangnam = req.query.ngaythangnam;
        }
        if (req.query.xoa) {
            filter.xoa = req.query.xoa; 
        }

        // Gọi hàm find với bộ lọc
        const documents = await workingtimeService.find(filter);
        // return res.send(documents);
        return res.status(200).json(documents);
    } catch (error) {
        return next(
            new ApiError(500, 'An error occurred while retrieving examinations')
        );
    }
     
};

exports.findOne = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }   
        const examinationService = new ExaminationService(pool);
        const document = await examinationService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Examination not found'));
        }
        return res.send(document);  
    } catch (error) {
        return next(    
            new ApiError(
                500,    
                `Error occurred while retrieving examination with id=${req.params.id}`
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
        const examinationService = new ExaminationService(pool);
        const document = await examinationService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Examination not found'));
        }
        return res.send({message: 'Examination was updated successfully'});
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while updating examination with id=${req.params.id}`
            )
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        if (!req.params.id) {
            return next(new ApiError(400, 'ID parameter is required'));
        }
        const examinationService = new ExaminationService(pool);
        const document = await examinationService.delete(req.params.id);       
        if (!document) {    
            return next(new ApiError(404, 'Examination not found'));
        }
        return res.send({message: 'Examination was deleted successfully'});
    }
    catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next(
            new ApiError(
                500,    
                `Error occurred while deleting examination with id=${req.params.id}`
            )
        );  
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const examinationService = new ExaminationService(pool);
        const deletedCount = await examinationService.deleteAll();
        if (deletedCount === 0) {
            return next(new ApiError(404, 'No records found to delete'));
        }
        return res.send({
            message: `${deletedCount} examinations were deleted successfully`
        });
    } catch (error) {
        return next(    
            new ApiError(
                500, 
                'An error occurred while deleting examinations'
            )
        );
    }
};