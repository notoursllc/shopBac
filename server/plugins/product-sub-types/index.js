const Joi = require('@hapi/joi');

const after = function (server) {
    const ProductSubTypeCtrl = new (require('./controllers/ProductSubTypeCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: `/subtypes`,
            options: {
                description: 'Gets a list of product sub types',
                handler: (request, h) => {
                    return ProductSubTypeCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `/subtype`,
            options: {
                description: 'Gets an product type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductSubTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `/subtype`,
            options: {
                description: 'Adds a new product type',
                validate: {
                    payload: ProductSubTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductSubTypeCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `/subtype`,
            options: {
                description: 'Updates product type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductSubTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductSubTypeCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `/subtype`,
            options: {
                description: 'Deletes a product type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductSubTypeCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductSubType',
        require('./models/ProductSubType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
