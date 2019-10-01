const Joi = require('@hapi/joi');
const path = require('path');

//TODO: this to be replaced by ProductVariantController right?
const productSizeController = require('./productSizeController');

const ProductCtrl = require('./ProductCtrl');
const ProductPicCtrl = require('./ProductPicCtrl');
const ProductArtistCtrl = require('./ProductArtistCtrl');
const ProductTypeCtrl = require('./ProductTypeCtrl');
const ProductSubTypeCtrl = require('./ProductSubTypeCtrl');
const ProductVariationCtrl = require('./ProductVariationCtrl');
const ProductOptionCtrl = require('./ProductOptionCtrl');
const MaterialTypeCtrl = require('./MaterialTypeCtrl');


const after = function (server) {
    const routePrefix = '/api/v1';

    const ProductController = new ProductCtrl(server, 'Product');
    const ProductPicController = new ProductPicCtrl(server, 'ProductPic');
    const ProductArtistController = new ProductArtistCtrl(server, 'ProductArtist');
    const ProductTypeController = new ProductTypeCtrl(server, 'ProductType');
    const ProductSubTypeController = new ProductSubTypeCtrl(server, 'ProductSubType');
    const ProductVariationController = new ProductVariationCtrl(server, 'ProductVariation');
    const ProductOptionController = new ProductOptionCtrl(server, 'ProductOption');
    const MaterialTypeController = new MaterialTypeCtrl(server, 'MaterialType');


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
                    return ProductController.getProductByIdHandler(request, h);
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
                    return ProductController.productSeoHandler(request, h);
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
                    return ProductController.productDeleteHandler(request, h);
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
                return ProductController.productShareHandler(request, h);
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/product/info`,
            options: {
                description: 'Returns general info about products',
                handler: (request, h) => {
                    return ProductController.productInfoHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/products`,
            options: {
                description: 'Gets a list of products',
                handler: (request, h) => {
                    return ProductController.getPageHandler(request, ProductController.getWithRelated(), h);
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
                        ...ProductController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductController.createHandler(request, h);
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
                        ...ProductController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductController.updateHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/product/variations`,
            options: {
                description: 'Gets a list of variations for a given product',
                validate: {
                    query: Joi.object({
                        product_id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductVariationController.getVariationsForProductHandler(request.query.product_id, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/product/variation`,
            options: {
                description: 'Adds a new variation to a product',
                validate: {
                    payload: ProductVariationController.getSchema()
                },
                handler: (request, h) => {
                    return ProductVariationController.createHandler(request, h);
                }
            }
        },


        /******************************
         * Product Size
         ******************************/
        {
            method: 'POST',
            path: `${routePrefix}/product/size/create`,
            options: {
                description: 'Adds a new size to the product',
                handler: productSizeController.productSizeCreateHandler
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/product/size/update`,
            options: {
                description: 'Updates a product size',
                handler: productSizeController.productSizeUpdateHandler
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/product/size`,
            options: {
                description: 'Deletes a product size',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: productSizeController.productSizeDeleteHandler
            }
        },

        /******************************
         * Product Pictures
         ******************************/
        {
            method: 'POST',
            path: `${routePrefix}/product/pic`,
            options: {
                description: 'Adds a new picture to the product',
                payload: {
                    output: 'stream',
                    parse: true,
                    allow: 'multipart/form-data',
                    maxBytes: 7 * 1000 * 1000  // 7MB
                },
                validate: {
                    payload: {
                        file: Joi.object(),
                        ...ProductPicController.getSchema()
                    }
                },
                handler: (request, h) => {
                    return ProductPicController.upsertHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/product/pic`,
            options: {
                description: 'Deletes a product picture',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductPicController.deleteHandler(request, h);
                }
            }
        },

        /******************************
         * Product Artists
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/artists`,
            options: {
                description: 'Gets a list of artists',
                handler: (request, h) => {
                    return ProductArtistController.getPageHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/artist`,
            options: {
                description: 'Gets an artist by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()  // artist ID
                    })
                },
                handler: (request, h) => {
                    return ProductArtistController.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/artist`,
            options: {
                description: 'Creates a product artist',
                validate: {
                    payload: Joi.object({
                        ...ProductArtistController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductArtistController.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/artist`,
            options: {
                description: 'Updates a product artist',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductArtistController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductArtistController.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/artist`,
            options: {
                description: 'Deletes an artist',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductArtistController.deleteHandler(request.query.id, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/artist/products`,
            options: {
                description: 'Gets a list of products for an artist',
                validate: {
                    query: {
                        id: Joi.string().max(100)
                    }
                },
                handler: (request, h) => {
                    return ProductController.getProductsForArtistHandler(request.query.id, h);
                }
            }
        },

        /******************************
         * Product Types
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/types`,
            options: {
                description: 'Gets a list of product types',
                handler: (request, h) => {
                    return ProductTypeController.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/type`,
            options: {
                description: 'Gets an product type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductTypeController.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/type`,
            options: {
                description: 'Adds a new product type',
                validate: {
                    payload: ProductTypeController.getSchema()
                },
                handler: (request, h) => {
                    return ProductTypeController.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/type`,
            options: {
                description: 'Updates product type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductTypeController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductTypeController.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/type`,
            options: {
                description: 'Deletes a product type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductTypeController.deleteHandler(request.query.id, h);
                }
            }
        },

        /******************************
         * Product Sub Types
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/subtypes`,
            options: {
                description: 'Gets a list of product sub types',
                handler: (request, h) => {
                    return ProductSubTypeController.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/subtype`,
            options: {
                description: 'Gets an product type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductSubTypeController.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/subtype`,
            options: {
                description: 'Adds a new product type',
                validate: {
                    payload: ProductSubTypeController.getSchema()
                },
                handler: (request, h) => {
                    return ProductSubTypeController.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/subtype`,
            options: {
                description: 'Updates product type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductSubTypeController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductSubTypeController.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/subtype`,
            options: {
                description: 'Deletes a product type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductSubTypeController.deleteHandler(request.query.id, h);
                }
            }
        },


        /******************************
         * Product Variations
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/variations`,
            options: {
                description: 'Gets a list of product variations',
                handler: (request, h) => {
                    return ProductVariationController.getPageHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/variation`,
            options: {
                description: 'Gets a ProductVariation by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductVariationController.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/variation`,
            options: {
                description: 'Updates a variation',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductVariationController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductVariationController.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/variation`,
            options: {
                description: 'Deletes a ProductVariation',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductVariationController.deleteHandler(request.query.id, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/variation/options`,
            options: {
                description: 'Gets a list of options for a given variation',
                validate: {
                    query: Joi.object({
                        product_variation_id: Joi.string().uuid().required() // product id
                    })
                },
                handler: (request, h) => {
                    return ProductOptionController.getOptionsForProductVariationHandler(request.query.product_variation_id, h);
                }
            }
        },


        /******************************
         * Product Options
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/options`,
            options: {
                description: 'Gets a list of options',
                handler: (request, h) => {
                    return ProductOptionController.getPageHandler(request, null, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/option`,
            options: {
                description: 'Gets a ProductOption by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductOptionController.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/option`,
            options: {
                description: 'Adds a new option to a product variation',
                validate: {
                    payload: ProductOptionController.getSchema()
                },
                handler: (request, h) => {
                    return ProductOptionController.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/option`,
            options: {
                description: 'Updates an option to a product variation',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductOptionController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductOptionController.createHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/option`,
            options: {
                description: 'Deletes a ProductOption',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductOptionController.deleteHandler(request.query.id, h);
                }
            }
        },


        /******************************
         * Material Types
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/materials`,
            options: {
                description: 'Gets a list of material types',
                handler: (request, h) => {
                    return MaterialTypeController.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/material`,
            options: {
                description: 'Gets an material type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return MaterialTypeController.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/material`,
            options: {
                description: 'Adds a new material type',
                validate: {
                    payload: MaterialTypeController.getSchema()
                },
                handler: (request, h) => {
                    return MaterialTypeController.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/material`,
            options: {
                description: 'Updates material type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...MaterialTypeController.getSchema()
                    })
                },
                handler: (request, h) => {
                    return MaterialTypeController.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/material`,
            options: {
                description: 'Deletes a material type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return MaterialTypeController.deleteHandler(request.query.id, h);
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
                return ProductController.sitemapHandler(request, h);
            }
        }
    ]);


    // registering events:
    server.event('SHOPPING_CART_CHECKOUT_SUCCESS');

    // defining event handlers:
    server.events.on(
        'SHOPPING_CART_CHECKOUT_SUCCESS',
        productSizeController.decrementInventoryCount
    );


    // LOADING BOOKSHELF MODELS:
    let baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

    server.app.bookshelf.model(
        'Product',
        require('./models/Product')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductArtist',
        require('./models/ProductArtist')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductType',
        require('./models/ProductType')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductSubType',
        require('./models/ProductSubType')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductPic',
        require('./models/ProductPic')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductPicVariant',
        require('./models/ProductPicVariant')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductSize',
        require('./models/ProductSize')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductVariation',
        require('./models/ProductVariation')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductOption',
        require('./models/ProductOption')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'MaterialType',
        require('./models/MaterialType')(baseModel, server.app.bookshelf, server)
    );
};


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        productSizeController.setServer(server);

        server.dependency(['BookshelfOrm', 'Core'], after);
    }
};
