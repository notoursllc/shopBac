const Joi = require('@hapi/joi');

const after = function (server) {
    const ProductSalesChannelTypeCtrl = new (require('./controllers/ProductSalesChannelTypeCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/sales_channel_types',
            options: {
                description: 'Gets a list of sales channel types',
                handler: (request, h) => {
                    return ProductSalesChannelTypeCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/sales_channel_type',
            options: {
                description: 'Gets a sales channel type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductSalesChannelTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/sales_channel_type',
            options: {
                description: 'Adds a new sales channel type',
                validate: {
                    payload: ProductSalesChannelTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductSalesChannelTypeCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/sales_channel_type',
            options: {
                description: 'Updates sales channel type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductSalesChannelTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductSalesChannelTypeCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/sales_channel_type',
            options: {
                description: 'Deletes a sales channel type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductSalesChannelTypeCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductSalesChannelType',
        require('./models/ProductSalesChannelType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
