const Joi = require('@hapi/joi');

const after = function (server) {
    const TenantCtrl = new (require('./controllers/TenantCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/tenants',
            options: {
                description: 'Gets a list of tenants',
                handler: (request, h) => {
                    return TenantCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/tenant',
            options: {
                description: 'Gets an master type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return TenantCtrl.getByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/tenant',
            options: {
                description: 'Adds a new tenant',
                validate: {
                    payload: TenantCtrl.getSchema()
                },
                handler: (request, h) => {
                    return TenantCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/tenant',
            options: {
                description: 'Updates a tenant',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...TenantCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return TenantCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/tenant',
            options: {
                description: 'Deletes a tenant',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return TenantCtrl.deleteHandler(request, h);
                }
            }
        }
    ]);

    // LOADING BOOKSHELF MODELS:
    const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'Tenant',
        require('./models/Tenant')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
