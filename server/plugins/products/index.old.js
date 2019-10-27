const Joi = require('@hapi/joi');
const path = require('path');

//TODO: this to be replaced by ProductVariantController right?
const productSizeController = require('./productSizeController');


const after = function (server) {
    const routePrefix = '/api/v1';

    // fancy shorthand instead of saving returned value of require() to a variable and doing 'new' on that variable
    const ProductCtrl = new (require('./controllers/ProductCtrl'))(server);
    const ProductPicCtrl = new (require('../product-pics/controllers/ProductPicCtrl'))(server);
    const ProductArtistCtrl = new (require('./ProductArtistCtrl'))(server);
    const ProductTaxCtrl = new (require('./ProductTaxCtrl'))(server);
    const ProductVariationCtrl = new (require('./ProductVariationCtrl'))(server);
    const ProductOptionCtrl = new (require('./ProductOptionCtrl'))(server);
    const MaterialTypeCtrl = new (require('./MaterialTypeCtrl'))(server);
    const OptionTypeCtrl = new (require('./OptionTypeCtrl'))(server);



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
         * Pictures
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/pics`,
            options: {
                description: 'Gets a list of pictures',
                handler: (request, h) => {
                    return ProductPicCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/pic`,
            options: {
                description: 'Gets a picture',
                handler: (request, h) => {
                    return ProductPicCtrl.getPicByIdHandler(request, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/pic`,
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
            path: `${routePrefix}/pic`,
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
                    return ProductArtistCtrl.getProductsForArtistHandler(request.query.id, h);
                }
            }
        },


        /******************************
         * Product Taxes
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/taxes`,
            options: {
                description: 'Gets a list of taxes',
                handler: (request, h) => {
                    return ProductTaxCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/tax`,
            options: {
                description: 'Gets a tax by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductTaxCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/tax`,
            options: {
                description: 'Adds a new tax',
                validate: {
                    payload: ProductTaxCtrl.getSchema()
                },
                handler: (request, h) => {
                    return ProductTaxCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/tax`,
            options: {
                description: 'Updates a tax',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...ProductTaxCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return ProductTaxCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/tax`,
            options: {
                description: 'Deletes a tax',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return ProductTaxCtrl.deleteHandler(request.query.id, h);
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
         * Option Types
         ******************************/
        {
            method: 'GET',
            path: `${routePrefix}/optiontypes`,
            options: {
                description: 'Gets a list of option types',
                handler: (request, h) => {
                    return OptionTypeCtrl.getAllHandler(request, h);
                }
            }
        },
        {
            method: 'GET',
            path: `${routePrefix}/optiontype`,
            options: {
                description: 'Gets an option type by ID',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return OptionTypeCtrl.getByIdHandler(request.query.id, null, h);
                }
            }
        },
        {
            method: 'POST',
            path: `${routePrefix}/optiontype`,
            options: {
                description: 'Adds a new option type',
                validate: {
                    payload: OptionTypeCtrl.getSchema()
                },
                handler: (request, h) => {
                    return OptionTypeCtrl.createHandler(request, h);
                }
            }
        },
        {
            method: 'PUT',
            path: `${routePrefix}/optiontype`,
            options: {
                description: 'Updates option type',
                validate: {
                    payload: Joi.object({
                        id: Joi.string().uuid().required(),
                        ...OptionTypeCtrl.getSchema()
                    })
                },
                handler: (request, h) => {
                    return OptionTypeCtrl.updateHandler(request, h);
                }
            }
        },
        {
            method: 'DELETE',
            path: `${routePrefix}/optiontype`,
            options: {
                description: 'Deletes a option type',
                validate: {
                    query: Joi.object({
                        id: Joi.string().uuid().required()
                    })
                },
                handler: (request, h) => {
                    return OptionTypeCtrl.deleteHandler(request.query.id, h);
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
    // TODO: use product options instead
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
        'ProductPic',
        require('../product-pics/models/ProductPic')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductPicVariant',
        require('../product-pics/models/ProductPicVariant')(baseModel, server.app.bookshelf, server)
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
        'OptionType',
        require('./models/OptionType')(baseModel, server.app.bookshelf, server)
    );

    server.app.bookshelf.model(
        'ProductTax',
        require('./models/ProductTax')(baseModel, server.app.bookshelf, server)
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
