const Joi = require('@hapi/joi');
const path = require('path');



exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(
            ['BookshelfOrm', 'Core'],
            function (server) {
                const routePrefix = '/api/v1';
                const ProductCtrl = new (require('./controllers/ProductCtrl'))(server);
                const ProductImageCtrl = new (require('./controllers/ProductImageCtrl'))(server);
                const ProductSkuCtrl = new (require('./controllers/ProductSkuCtrl'))(server);
                const ProductSkuImageCtrl = new (require('./controllers/ProductSkuImageCtrl'))(server);
                const ProductSkuVariantTypeCtrl = new (require('./controllers/ProductSkuVariantTypeCtrl'))(server);
                const ProductCollectionCtrl = new (require('./controllers/ProductCollectionCtrl'))(server);
                const ProductSpecTableCtrl = new (require('./controllers/ProductSpecTableCtrl'))(server);

                const payloadMaxBytes = process.env.ROUTE_PAYLOAD_MAXBYTES || 10485760; // 10MB (1048576 (1 MB) is the default)

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
                            auth: {
                                strategies: ['jwt', 'session']
                            },
                            handler: (request, h) => {
                                return ProductCtrl.getPageHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product`,
                        options: {
                            description: 'Finds a product by ID',
                            auth: {
                                strategies: ['jwt', 'session']
                            },
                            validate: {
                                query: {
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid(),
                                    viewAllRelated: Joi.boolean().optional()
                                }
                            },
                            handler: (request, h) => {
                                return ProductCtrl.getByIdHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product`,
                        options: {
                            description: 'Creates a product',
                            validate: {
                                payload: ProductCtrl.getSchema()
                            },
                            handler: (request, h) => {
                                return ProductCtrl.upsertHandler(request, h);
                            },
                            payload: {
                                maxBytes: payloadMaxBytes
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product`,
                        options: {
                            description: 'Updates a product',
                            validate: {
                                payload: ProductCtrl.getSchema(true)
                            },
                            handler: (request, h) => {
                                return ProductCtrl.upsertHandler(request, h);
                            },
                            payload: {

                                maxBytes: payloadMaxBytes
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/seo`,
                        options: {
                            description: 'Finds a product by it\'s seo uri',
                            auth: {
                                strategies: ['jwt', 'session']
                            },
                            validate: {
                                query: {
                                    id: Joi.string().max(100),
                                    tenant_id: Joi.string().uuid()
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
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                // TODO:  need to refactor this
                                return ProductCtrl.deleteHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/image`,
                        options: {
                            description: 'Deletes a Product image',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return ProductImageCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************************
                     * Product Skus
                     ******************************/
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/sku`,
                        options: {
                            description: 'Deletes a product SKU',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return ProductSkuCtrl.deleteHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/sku/image`,
                        options: {
                            description: 'Deletes a product SKU image',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return ProductSkuImageCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************************
                     * Product Sku options
                     ******************************/
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/sku/variant_types`,
                        options: {
                            description: 'Finds SKU options',
                            handler: (request, h) => {
                                return ProductSkuVariantTypeCtrl.getPageHandler(
                                    request,
                                    null,
                                    h
                                );
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/sku/variant_type`,
                        options: {
                            description: 'Finds a SKU variant by ID',
                            validate: {
                                query: {
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid()
                                }
                            },
                            handler: (request, h) => {
                                return ProductSkuVariantTypeCtrl.getByIdHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product/sku/variant_type`,
                        options: {
                            description: 'Add a SKU variant',
                            validate: {
                                payload: ProductSkuVariantTypeCtrl.getSchema()
                            },
                            handler: (request, h) => {
                                return ProductSkuVariantTypeCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product/sku/variant_type`,
                        options: {
                            description: 'Updates a SKU variant',
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    ...ProductSkuVariantTypeCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductSkuVariantTypeCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/sku/variant_type`,
                        options: {
                            description: 'Deletes a SKU variant',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return ProductSkuVariantTypeCtrl.deleteHandler(request, h);
                            }
                        }
                    },

                    /******************************
                     * Product Collections
                     ******************************/
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/collections`,
                        options: {
                            description: 'Gets a list of product collections',
                            handler: (request, h) => {
                                return ProductCollectionCtrl.getPageHandler(request, null, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/collection`,
                        options: {
                            description: 'Gets a product collection by ID',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductCollectionCtrl.getByIdHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product/collection`,
                        options: {
                            description: 'Adds a new product collection',
                            validate: {
                                payload: ProductCollectionCtrl.getSchema()
                            },
                            handler: (request, h) => {
                                return ProductCollectionCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product/collection`,
                        options: {
                            description: 'Updates a product collection',
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    ...ProductCollectionCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductCollectionCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/collection`,
                        options: {
                            description: 'Deletes a product collection',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductCollectionCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************************
                     * Product Spec Tables
                     ******************************/
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/spec_tables`,
                        options: {
                            description: 'Gets a list of product spec tables',
                            handler: (request, h) => {
                                return ProductSpecTableCtrl.getPageHandler(request, null, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/spec_table`,
                        options: {
                            description: 'Gets a product spec table by ID',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductSpecTableCtrl.getByIdHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product/spec_table`,
                        options: {
                            description: 'Adds a new product spec table',
                            validate: {
                                payload: ProductSpecTableCtrl.getSchema()
                            },
                            handler: (request, h) => {
                                return ProductSpecTableCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product/spec_table`,
                        options: {
                            description: 'Updates a product spec table',
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    ...ProductSpecTableCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductSpecTableCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/spec_table`,
                        options: {
                            description: 'Deletes a product spec table',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductSpecTableCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************************
                     * Misc
                     ******************************/
                    {
                        method: 'GET',
                        path: '/product/share', // NOTE: no routePrefix on this one
                        options: {
                            auth: {
                                strategies: ['jwt', 'session']
                            },
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
                            auth: {
                                strategies: ['jwt', 'session']
                            },
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
                        path: '/sitemap.xml', // NOTE: no routePrefix on this one
                        options: {
                            auth: {
                                strategies: ['jwt', 'session']
                            }
                        },
                        handler: (request, h) => {
                            return ProductCtrl.sitemapHandler(request, h);
                        }
                    }
                ]);


                // LOADING BOOKSHELF MODELS:
                const baseModel = require('bookshelf-modelbase')(server.app.bookshelf);

                server.app.bookshelf.model(
                    'Product',
                    require('./models/Product')(baseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductImage',
                    require('./models/ProductImage')(baseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductSku',
                    require('./models/ProductSku')(baseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductSkuImage',
                    require('./models/ProductSkuImage')(baseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductSkuVariant',
                    require('./models/ProductSkuVariant')(baseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductCollection',
                    require('./models/ProductCollection')(baseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductSpecTable',
                    require('./models/ProductSpecTable')(baseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
