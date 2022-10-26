const Joi = require('joi');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(
            ['BookshelfOrm', 'Core'],
            function (server) {

                const MediaCtrl = new (require('./controllers/MediaCtrl'))(server);
                const payloadMaxBytes = process.env.ROUTE_PAYLOAD_MAXBYTES || 10485760; // 10MB (1048576 (1 MB) is the default)
                const videoPayloadMaxBytes = process.env.VIDEO_PAYLOAD_MAXBYTES || 1000000000; // 1 gb

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
                                    ...MediaCtrl.getTenantIdSchema()
                                })
                            },
                            handler: (request, h) => {
                                return MediaCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: '/media/image',
                        options: {
                            description: 'Adds a new resource',
                            payload: {
                                // output: 'stream',
                                output: 'file',
                                parse: true,
                                allow: 'multipart/form-data',
                                maxBytes: payloadMaxBytes,
                                multipart: true
                            },
                            validate: {
                                payload: Joi.object({
                                    file: Joi.object(),
                                    ...MediaCtrl.getTenantIdSchema()
                                })
                            },
                            handler: (request, h) => {
                                return MediaCtrl.imageUpsertHandler(request, h);
                            }
                        }
                    },

                    // VIDEO
                    {
                        method: 'POST',
                        path: '/media/video',
                        options: {
                            description: 'Adds a new video',
                            payload: {
                                // output: 'stream',
                                output: 'file',
                                parse: true,
                                allow: 'multipart/form-data',
                                maxBytes: videoPayloadMaxBytes,
                                multipart: true
                            },
                            validate: {
                                payload: Joi.object({
                                    file: Joi.object(),
                                    ...MediaCtrl.getTenantIdSchema()
                                })
                            },
                            handler: (request, h) => {
                                return MediaCtrl.videoUpsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: '/media/video',
                        options: {
                            description: 'Deletes a new video',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    ...MediaCtrl.getTenantIdSchema()
                                })
                            },
                            handler: (request, h) => {
                                return MediaCtrl.videoDeleteHandler(request, h);
                            }
                        }
                    }
                ]);


                // LOADING BOOKSHELF MODELS:
                server.app.bookshelf.model(
                    'Media',
                    require('./models/Media')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
