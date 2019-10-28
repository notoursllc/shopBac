const Joi = require('@hapi/joi');
const path = require('path');


const after = function (server) {
    const routePrefix = '/api/v1';

    // fancy shorthand instead of saving returned value of require() to a variable and doing 'new' on that variable
    const ProductCtrl = new (require('./controllers/ProductCtrl'))(server);
    // const ProductVariationCtrl = new (require('./ProductVariationCtrl'))(server);



    // Yes this was aleady set in the Core plugin, but apparently
    // it must be set in every plugin that needs a view engine:
    // https://github.com/hapijs/vision/issues/94
    server.views({
        engines: {
            html: require('handlebars')
        },
        // path: path.resolve(__dirname, '../../..')
        path: path.resolve(__dirname, '../../../dist')
        // path: '../../../dist/views',
        // partialsPath: '../../views/partials',
        // relativeTo: __dirname // process.cwd() // prefer this over __dirname when compiling to dist/cjs and using rollup
    });

    server.route([
        {
            method: 'GET',
            path: `${routePrefix}/products`,
            options: {
                description: 'Gets a list of products',
                handler: (request, h) => {
                    return ProductCtrl.getPageHandler(request, ProductCtrl.getWithRelated(), h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/product`,
            options: {
                description: 'Finds a product by ID',
                validate: {
                    query: {
                        id: Joi.string().uuid(),
                        viewAllRelated: Joi.boolean().optional()
                    }
                },
                handler: (request, h) => {
                    return ProductCtrl.getProductByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/product`,
            options: {
                description: 'Creates a product',
                validate: {
                    payload: Joi.object({
                        ...ProductCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/product`,
            options: {
                description: 'Updates a product',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/product/seo`,
            options: {
                description: 'Finds a product by it\'s seo uri',
                validate: {
                    query: {
                        id: Joi.string().max(100)
                    }
                },
                handler: (request, h) => {
                    return ProductCtrl.productSeoHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/product`,
            options: {
                description: 'Deletes a product',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductCtrl.productDeleteHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: '/product/share',  // NOTE: no routePrefix on this one
            options: {
                auth: false,
                validate: {
                    query: {
                        uri: Joi.string()
                    }
                }
            },
            handler: (request, h) => {
                return ProductCtrl.productShareHandler(request, h);
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/product/info`,
            options: {
                description: 'Returns general info about products',
                handler: (request, h) => {
                    return ProductCtrl.productInfoHandler(request, h);
                }
            }
        },

        /******************************
         * Admin routes
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/admin/products`,
            options: {
                description: 'Gets a list of products',
                handler: (request, h) => {
                    return ProductCtrl.getAdminProductList(request, h);
                }
            }
        },

        /******************************
         * Other
         ******************************/
        {
            method: 'GET',
            path: '/sitemap.xml',  // NOTE: no routePrefix on this one
            options: {
                auth: false
            },
            handler: (request, h) => {
                return ProductCtrl.sitemapHandler(request, h);
            }
        }
    ]);


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'Product',
        require('./models/Product')(baseModel, server.app.bookshelf, server)
    );

};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
