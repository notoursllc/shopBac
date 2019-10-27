const Joi = require('@hapi/joi');

const after = function (server) {
    const ProductFitTypeCtrl = new (require('./controllers/ProductFitTypeCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: `/fit_types`,
            options: {
                description: 'Gets a list of fit types',
                handler: (request, h) => {
                    return ProductFitTypeCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `/fit_type`,
            options: {
                description: 'Gets an fit type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductFitTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `/fit_type`,
            options: {
                description: 'Adds a new fit type',
                validate: {
                    payload: ProductFitTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductFitTypeCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `/fit_type`,
            options: {
                description: 'Updates fit type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductFitTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductFitTypeCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `/fit_type`,
            options: {
                description: 'Deletes a fit type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductFitTypeCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductFitType',
        require('./models/ProductFitType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
