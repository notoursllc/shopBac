const Joi = require('@hapi/joi');


const after = function (server) {
    const ProductVariantCtrl = new (require('./controllers/ProductVariantCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/product_variant',
            options: {
                description: 'Gets an product variant by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductVariantCtrl.getByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/product_variant',
            options: {
                description: 'Adds a new product variant',
                validate: {
                    payload: ProductVariantCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductVariantCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/product_variant',
            options: {
                description: 'Updates a product variant',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductVariantCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductVariantCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/product_variant',
            options: {
                description: 'Deletes a product variant',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductVariantCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductVariant',
        require('./models/ProductVariant')(baseModel, server.app.bookshelf, server)
    );

};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
