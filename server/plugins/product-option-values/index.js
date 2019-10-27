const Joi = require('@hapi/joi');

const after = function (server) {
    const ProductOptionValueCtrl = new (require('./controllers/ProductOptionValueCtrl'))(server);

    server.route([
        {
            method: 'POST',
            path: '/product_option_value',
            options: {
                description: 'Adds a new product option value',
                validate: {
                    payload: ProductOptionValueCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductOptionValueCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/product_option_value',
            options: {
                description: 'Updates a product option value',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductOptionValueCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductOptionValueCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/product_option_value',
            options: {
                description: 'Deletes a product option value',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductOptionValueCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductOptionValue',
        require('./models/ProductOptionValue')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
