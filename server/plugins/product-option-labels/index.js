const Joi = require('@hapi/joi');

const after = function (server) {
    const ProductOptionLabelCtrl = new (require('./controllers/ProductOptionLabelCtrl'))(server);

    server.route([
        // {
        //     method: 'GET',
        //     path: '/product',
        //     options: {
        //         description: 'Gets a list of collections',
        //         handler: (request, h) => {
        //             return ProductCollectionCtrl.getPageHandler(request, null, h);
        //         }
        //     }
        // },
        // {
        //     method: 'GET',
        //     path: '/collection',
        //     options: {
        //         description: 'Gets an collection by ID',
        //         validate: {
        //             query: Joi.object({
        //                 id: Joi.string().uuid().required()
        //             })
        //         },
        //         handler: (request, h) => {
        //             return ProductCollectionCtrl.getByIdHandler(request.query.id, null, h);
        //         }
        //     }
        // },
        {
            method: 'POST',
            path: '/product_option_label',
            options: {
                description: 'Adds a new product option label',
                validate: {
                    payload: ProductOptionLabelCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductOptionLabelCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/product_option_label',
            options: {
                description: 'Updates a product option label',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductOptionLabelCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductOptionLabelCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/product_option_label',
            options: {
                description: 'Deletes a product option label',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductOptionLabelCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductOptionLabel',
        require('./models/ProductOptionLabel')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
