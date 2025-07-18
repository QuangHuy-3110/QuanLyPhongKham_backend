const DrugService = require('../services/drug.service');
const pool = require('../utils/db.util');
const ApiError = require('../api-error');

exports.create = async (req, res, next) => {
    try {
        const drugService = new DrugService(pool);
        const document = await drugService.addDrug(req.body);
        return res.send(document);
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        return next (
            new ApiError(500, "An error occurred while creating the drug")
        );
    }
}

exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const drugService = new DrugService(pool);
        const { name, xoa, maNPP } = req.query;
        const filter = {};
        if (name) {
            documents = await drugService.findByName(name);
            return res.send(documents);
        } 
        if (xoa) {
            filter.xoa = xoa;
        }
        if (maNPP) {
            filter.maNPP = maNPP;
        }
        documents = await drugService.find(filter);
        return res.send(documents); 
    } catch (error) {
        return next(
            new ApiError(500, 'An error occurred while retrieving drugs')
        );
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const drugService = new DrugService(pool);
        const document = await drugService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, 'Drug not found'));
        }
        return res.send(document);  
    } catch (error) {
        return next(    
            new ApiError(500,`Error occurred while retrieving drug with id=${req.params.id}`)
        );
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(new ApiError(400, 'Data to update can not be empty'));
    }
    try {
        const drugService = new DrugService(pool);
        const document = await drugService.update(req.params.id, req.body);
        if (!document) {
            return next(new ApiError(404, 'Drug not found'));
        }
        return res.send({message: 'Drug was updated successfully'});
    } catch (error) {
        return next(
            new ApiError(500, `Error occurred while updating drug with id=${req.params.id}`)
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        const drugService = new DrugService(pool);
        const document = await drugService.delete(req.params.id);
        if (!document) {    
            return next(new ApiError(404, 'Drug not found'));
        }
        return res.send({message: 'Drug was deleted successfully'});
    }
    catch (error) {
        return next(
            new ApiError(500,`Error occurred while deleting drug with id=${req.params.id}`)
        );  
    }
};

exports.deleteAll = async (req, res, next) => {
    try {
        const drugService = new DrugService(pool);
        const deletedCount = await drugService.deleteAll();
        return res.send({
            message: `${deletedCount} Drugs were deleted successfully`
        });
    } catch (error) {
        return next(    
            new ApiError(500, 'An error occurred while deleting drugs')
        );
    }
};
