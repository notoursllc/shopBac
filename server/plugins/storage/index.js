const Joi = require('@hapi/joi');

const after = function (server) {
    const StorageCtrl = new (require('./controllers/StorageCtrl'))(server);

    server.route([
        {
            method: 'POST',
            path: '/storage/image',
            options: {
                description: 'Uploads a new image to object storage',
                payload: {
                    output: 'stream',
                    parse: true,
                    allow: 'multipart/form-data',
                    maxBytes: 7 * 1000 * 1000  // 7MB
                },
                validate: {
                    payload: Joi.object({
                        file: Joi.object()
                    })
                },
                handler: (request, h) => {
                    return StorageCtrl.uploadImageHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/storage/image',
            options: {
                description: 'Deletes an image from object storage',
                validate: {
                    query: Joi.object({
                        url: Joi.string().required()
                    })
                },
                handler: (request, h) => {
                    return StorageCtrl.deleteHandler(request.query.url, h);
                }
            }
        }
    ]);
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
