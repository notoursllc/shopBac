const Joi = require('@hapi/joi');

const after = function (server) {
    const ProductTypeCtrl = new (require('./controllers/ProductTypeCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/types',
            options: {
                description: 'Gets a list of product types',
                handler: (request, h) => {
                    return ProductTypeCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/type',
            options: {
                description: 'Gets an product type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/type',
            options: {
                description: 'Adds a new product type',
                validate: {
                    payload: ProductTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductTypeCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/type',
            options: {
                description: 'Updates product type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductTypeCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/type',
            options: {
                description: 'Deletes a product type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductTypeCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductType',
        require('./models/ProductType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
