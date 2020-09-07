const Joi = require('@hapi/joi');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(
            ['BookshelfOrm', 'Core'],
            function (server) {

                const MediaCtrl = new (require('./controllers/MediaCtrl'))(server);
                const payloadMaxBytes = process.env.ROUTE_PAYLOAD_MAXBYTES || 10485760; // 10MB (1048576 (1 MB) is the default)

                server.route([
                    {
                        method: 'GET',
                        path: '/media',
                        options: {
                            description: 'Finds a media object by ID',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return MediaCtrl.getByIdHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/media/image',
                        options: {
                            description: 'Adds a new resource',
                            payload: {
                                output: 'stream',
                                parse: true,
                                allow: 'multipart/form-data',
                                maxBytes: payloadMaxBytes
                            },
                            validate: {
                                payload: Joi.object({
                                    file: Joi.object(),
                                    tenant_id: Joi.string().uuid()
                                    // ...MediaCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return MediaCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    // {
                    //     method: 'POST',
                    //     path: '/media',
                    //     options: {
                    //         description: 'Creates/uploads a media resource',
                    //         validate: {
                    //             payload: Joi.object({
                    //                 ...MediaCtrl.getSchema()
                    //             })
                    //         },
                    //         handler: (request, h) => {
                    //             return MediaCtrl.upsertHandler(request, h);
                    //         },
                    //         payload: {
                    //             maxBytes: payloadMaxBytes
                    //         }
                    //     }
                    // },
                    {
                        method: 'DELETE',
                        path: '/media',
                        options: {
                            description: 'Deletes a media resource',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return MediaCtrl.deleteHandler(request, h);
                            }
                        }
                    }
                ]);


                // LOADING BOOKSHELF MODELS:
                const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

                server.app.bookshelf.model(
                    'Media',
                    require('./models/Media')(baseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
