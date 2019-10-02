const Joi = require('@hapi/joi');
const path = require('path');

//TODO: this to be replaced by ProductVariantController right?
const productSizeController = require('./productSizeController');


const after = function (server) {
    const routePrefix = '/api/v1';

    // fancy shorthand instead of saving returned value of require() to a variable and doing 'new' on that variable
    const ProductCtrl = new (require('./ProductCtrl'))(server, 'Product');
    const ProductPicCtrl = new (require('./ProductPicCtrl'))(server, 'ProductPic');
    const ProductArtistCtrl = new (require('./ProductArtistCtrl'))(server, 'ProductArtist');
    const ProductTypeCtrl = new (require('./ProductTypeCtrl'))(server, 'ProductType');
    const ProductSubTypeCtrl = new (require('./ProductSubTypeCtrl'))(server, 'ProductSubType');
    const ProductVariationCtrl = new (require('./ProductVariationCtrl'))(server, 'ProductVariation');
    const ProductOptionCtrl = new (require('./ProductOptionCtrl'))(server, 'ProductOption');
    const MaterialTypeCtrl = new (require('./MaterialTypeCtrl'))(server, 'MaterialType');
    const FitTypeCtrl = new (require('./FitTypeCtrl'))(server, 'FitType');


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
                    return ProductCtrl.getProductByIdHandler(request, h);
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
            path: `${routePrefix}/product/variations`,
            options: {
                description: 'Gets a list of variations for a given product',
                validate: {
                    query: Joi.object({
                        product_id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductVariationCtrl.getVariationsForProductHandler(request.query.product_id, h);
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
            path: `${routePrefix}/product/pic`,
            options: {
                description: 'Deletes a product picture',
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

        /******************************
         * Product Artists
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/artists`,
            options: {
                description: 'Gets a list of artists',
                handler: (request, h) => {
                    return ProductArtistCtrl.getPageHandler(request, null, h);
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
                    return ProductArtistCtrl.getByIdHandler(request.query.id, null, h);
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
                        ...ProductArtistCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductArtistCtrl.createHandler(request, h);
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
                        ...ProductArtistCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductArtistCtrl.updateHandler(request, h);
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
                    return ProductArtistCtrl.deleteHandler(request.query.id, h);
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
                    return ProductCtrl.getProductsForArtistHandler(request.query.id, h);
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
                    return ProductTypeCtrl.getAllHandler(request, h);
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
                    return ProductTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/type`,
            options: {
                description: 'Adds a new product type',
                validate: {
                    payload: ProductTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductTypeCtrl.createHandler(request, h);
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
                        ...ProductTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductTypeCtrl.updateHandler(request, h);
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
                    return ProductTypeCtrl.deleteHandler(request.query.id, h);
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
                    return ProductSubTypeCtrl.getAllHandler(request, h);
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
                    return ProductSubTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/subtype`,
            options: {
                description: 'Adds a new product type',
                validate: {
                    payload: ProductSubTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductSubTypeCtrl.createHandler(request, h);
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
                        ...ProductSubTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductSubTypeCtrl.updateHandler(request, h);
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
                    return ProductSubTypeCtrl.deleteHandler(request.query.id, h);
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
                    return ProductVariationCtrl.getPageHandler(request, null, h);
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
                    return ProductVariationCtrl.getVariationByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/variation`,
            options: {
                description: 'Adds a new variation to a product',
                validate: {
                    payload: ProductVariationCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductVariationCtrl.createHandler(request, h);
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
                        ...ProductVariationCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductVariationCtrl.updateHandler(request, h);
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
                    return ProductVariationCtrl.deleteHandler(request.query.id, h);
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
                    return ProductOptionCtrl.getOptionsForProductVariationHandler(request.query.product_variation_id, h);
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
                    return ProductOptionCtrl.getPageHandler(request, null, h);
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
                    return ProductOptionCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/option`,
            options: {
                description: 'Adds a new option to a product variation',
                validate: {
                    payload: ProductOptionCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductOptionCtrl.createHandler(request, h);
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
                        ...ProductOptionCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductOptionCtrl.createHandler(request, h);
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
                    return ProductOptionCtrl.deleteHandler(request.query.id, h);
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
                    return MaterialTypeCtrl.getAllHandler(request, h);
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
                    return MaterialTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/material`,
            options: {
                description: 'Adds a new material type',
                validate: {
                    payload: MaterialTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return MaterialTypeCtrl.createHandler(request, h);
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
                        ...MaterialTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return MaterialTypeCtrl.updateHandler(request, h);
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
                    return MaterialTypeCtrl.deleteHandler(request.query.id, h);
                }
            }
        },


        /******************************
         * Fit Types
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/fits`,
            options: {
                description: 'Gets a list of fit types',
                handler: (request, h) => {
                    return FitTypeCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/fit`,
            options: {
                description: 'Gets an fit type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return FitTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/fit`,
            options: {
                description: 'Adds a new fit type',
                validate: {
                    payload: FitTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return FitTypeCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/fit`,
            options: {
                description: 'Updates fit type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...FitTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return FitTypeCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/fit`,
            options: {
                description: 'Deletes a fit type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return FitTypeCtrl.deleteHandler(request.query.id, h);
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

    server.app.bookshelf.model(
        'FitType',
        require('./models/FitType')(baseModel, server.app.bookshelf, server)
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
