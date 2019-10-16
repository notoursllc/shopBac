const Joi = require('@hapi/joi');
const ShippingController = require('./shippingController');

const after = function (server) {
    const ShippingPackageTypeCtrl = new (require('./ShippingPackageTypeCtrl'))(server);

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
                handler: ShippingController.validateAddress
            }
        },

        {
            method: 'GET',
            path: `/shipping/packagetypes`,
            options: {
                description: 'Gets a list of package types',
                // handler: ShippingController.packageTypeListHandler
                handler: (request, h) => {
                    return ShippingPackageTypeCtrl.getAllHandler(request, h);
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
                    return ShippingPackageTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `/shipping/packagetype`,
            options: {
                description: 'Creates a package type',
                validate: {
                    payload: Joi.object({
                        ...ShippingPackageTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ShippingPackageTypeCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `/shipping/packagetype`,
            options: {
                description: 'Updates a package type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ShippingPackageTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ShippingPackageTypeCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `/shipping/packagetype`,
            options: {
                description: 'Deletes a package type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required(),
                    })
                },
                handler: (request, h) => {
                    return ShippingPackageTypeCtrl.deleteHandler(request.query.id, h);
                }
            }
        }
    ]);

    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'PackageType',
        require('./models/PackageType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        ShippingController.setServer(server);

        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
