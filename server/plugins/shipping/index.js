const Joi = require('@hapi/joi');

const after = function (server) {
    const ShippingCtrl = new (require('./ShippingCtrl'))(server);

    server.route([
        {
            method: 'POST',
            path: '/shipping/validateAddress',
            options: {
                description: 'Validates an address',
                validate: {
                    payload: {
                        name: Joi.string(),
                        company: Joi.string().allow(null),
                        street1: Joi.string().required(),
                        street2: Joi.string().allow(''),
                        street3: Joi.string().allow(''),
                        city: Joi.string().required(),
                        state: Joi.string().required(),
                        zip: Joi.string().required(),
                        country: Joi.string().max(3).regex(/^[A-z]+$/).required()
                    }
                },
                handler: ShippingCtrl.validateAddress
            }
        },

        {
            method: 'GET',
            path: '/shipping/packagetypes',
            options: {
                description: 'Gets a list of package types',
                handler: (request, h) => {
                    return ShippingCtrl.getAllHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/shipping/packagetype',
            options: {
                description: 'Finds a package type by ID',
                validate: {
                    query: {
                        id: Joi.string().uuid()
                    }
                },
                handler: (request, h) => {
                    return ShippingCtrl.getByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/shipping/packagetype',
            options: {
                description: 'Creates a package type',
                validate: {
                    payload: Joi.object({
                        ...ShippingCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ShippingCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/shipping/packagetype',
            options: {
                description: 'Updates a package type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ShippingCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ShippingCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/shipping/packagetype',
            options: {
                description: 'Deletes a package type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required(),
                    })
                },
                handler: (request, h) => {
                    return ShippingCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);

    // LOADING BOOKSHELF MODELS:
    const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'PackageType',
        require('./models/PackageType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
