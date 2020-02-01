const Joi = require('@hapi/joi');

const after = function (server) {
    const ProductCollectionCtrl = new (require('./controllers/ProductCollectionCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/collections',
            options: {
                description: 'Gets a list of collections',
                handler: (request, h) => {
                    return ProductCollectionCtrl.getPageHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/collection',
            options: {
                description: 'Gets an collection by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductCollectionCtrl.getByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/collection',
            options: {
                description: 'Adds a new collection',
                validate: {
                    payload: ProductCollectionCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductCollectionCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/collection',
            options: {
                description: 'Updates a collection',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductCollectionCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductCollectionCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/collection',
            options: {
                description: 'Deletes a collection',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductCollectionCtrl.deleteHandler(request, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductCollection',
        require('./models/ProductCollection')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
