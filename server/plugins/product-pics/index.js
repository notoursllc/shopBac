const Joi = require('@hapi/joi');

const after = function (server) {
    const ProductPicCtrl = new (require('./controllers/ProductPicCtrl'))(server);
    const ProductPicVariantCtrl = new (require('./controllers/ProductPicVariantCtrl'))(server);

    server.route([
        {
            method: 'GET',
            path: '/pics',
            options: {
                description: 'Gets a list of pictures',
                handler: (request, h) => {
                    return ProductPicCtrl.getPageHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/pic',
            options: {
                description: 'Gets a picture',
                handler: (request, h) => {
                    return ProductPicCtrl.getPicByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: '/pic',
            options: {
                description: 'Adds a new picture',
                payload: {
                    output: 'stream',
                    parse: true,
                    allow: 'multipart/form-data',
                    maxBytes: 7 * 1000 * 1000  // 7MB
                },
                validate: {
                    payload: {
                        file: Joi.object(),
                        ...ProductPicCtrl.getSchema()
                    }
                },
                handler: (request, h) => {
                    return ProductPicCtrl.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/pic',
            options: {
                description: 'Deletes a picture',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductPicCtrl.deleteHandler(request, h);
                }
            }
        },


        /**
         * Pic Variants
         *
         * Just a couple of APIs that might only be useful for identifying pic variants
         * that are abandoned without a 'parent' product pic, and deleting abandoned ones
         *
         * Note there is no POST endpoint.  We should never be posting
         * a pic variant directly... they are always created as a artifact of
         * creating a product pic
         */
        {
            method: 'GET',
            path: '/pic_variants',
            options: {
                description: 'Gets a list of picture variants',
                handler: (request, h) => {
                    return ProductPicVariantCtrl.getPageHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: '/pic_variant',
            options: {
                description: 'Deletes a picture variants',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductPicVariantCtrl.deleteHandler(request, h);
                }
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'ProductPic',
        require('./models/ProductPic')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductPicVariant',
        require('./models/ProductPicVariant')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
