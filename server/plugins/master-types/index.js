const Joi = require('@hapi/joi');

const after = function (server) {
    const MasterTypeCtrl = new (require('./controllers/MasterTypeCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/master_types',
            options: {
                description: 'Gets a list of master types',
                auth: {
                    strategies: ['storeauth', 'session']
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.getPageHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/master_types/all',
            options: {
                description: 'Gets a list of master types',
                auth: {
                    strategies: ['storeauth', 'session']
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.getAllHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/master_type',
            options: {
                description: 'Gets an master type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required(),
                        tenant_id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.getByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/master_type',
            options: {
                description: 'Adds a new master type',
                validate: {
                    payload: Joi.object({
                        ...MasterTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: '/master_type',
            options: {
                description: 'Updates master type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...MasterTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/master_type',
            options: {
                description: 'Deletes a master type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required(),
                        tenant_id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return MasterTypeCtrl.deleteHandler(request, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'MasterType',
        require('./models/MasterType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
