const Joi = require('joi');


exports.plugin = {
    once: true,
    pkg: require('./package.json'),
    register: function (server, options) {
        server.dependency(
            ['BookshelfOrm', 'Core'],
            function (server) {
                const routePrefix = '/api/v1';
                const ProductCtrl = new (require('./controllers/ProductCtrl'))(server);
                const ProductVariantCtrl = new (require('./controllers/ProductVariantCtrl'))(server);
                const ProductVariantSkuCtrl = new (require('./controllers/ProductVariantSkuCtrl'))(server);
                const ProductAccentMessageCtrl = new (require('./controllers/ProductAccentMessageCtrl'))(server);
                const ProductColorSwatchCtrl = new (require('./controllers/ProductColorSwatchCtrl'))(server);
                const ProductCollectionCtrl = new (require('./controllers/ProductCollectionCtrl'))(server);
                const ProductDataTableCtrl = new (require('./controllers/ProductDataTableCtrl'))(server);
                const ProductArtistCtrl = new (require('./controllers/ProductArtistCtrl'))(server);

                const payloadMaxBytes = process.env.ROUTE_PAYLOAD_MAXBYTES || 10485760; // 10MB (1048576 (1 MB) is the default)
                const productUpsertMaxBytes =1000000000; // 1 gb

                server.route([
                    {
                        method: 'GET',
                        path: `${routePrefix}/products`,
                        options: {
                            description: 'Gets a list of products',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid(),
                                    published: Joi.boolean(),
                                    sub_type: Joi.alternatives().try(
                                        Joi.number().integer().positive(),
                                        Joi.string()
                                    ),
                                    ...ProductCtrl.getPaginationSchema(),
                                    ...ProductCtrl.getWithRelatedSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductCtrl.fetchAllForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product`,
                        options: {
                            description: 'Finds a product by ID',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid(),
                                    tenant_id: Joi.string().uuid(),
                                    ...ProductCtrl.getWithRelatedSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/tax_codes`,
                        options: {
                            description: 'Returns a list of Stripe tax codes',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return ProductCtrl.getStripeTaxCodesHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product`,
                        options: {
                            description: 'Creates a product',
                            payload: {
                            //     // output: 'stream',
                            //     output: 'file',
                            //     parse: true,
                            //     allow: 'multipart/form-data',
                            //     multipart: true,
                                maxBytes: productUpsertMaxBytes,
                            },
                            validate: {
                                payload: Joi.object({
                                    ...ProductCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product`,
                        options: {
                            description: 'Updates a product',
                            payload: {
                            //     // output: 'stream',
                            //     output: 'file',
                            //     parse: true,
                            //     allow: 'multipart/form-data',
                            //
                            //     multipart: true,
                                maxBytes: productUpsertMaxBytes,
                            },
                            validate: {
                                payload: Joi.object({
                                    ...ProductCtrl.getSchema(true)
                                })
                            },
                            handler: (request, h) => {
                                return ProductCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product`,
                        options: {
                            description: 'Deletes a product',
                            auth: {
                                strategies: ['session']
                            },
                            validate: {
                                query: Joi.object({
                                    ...ProductCtrl.getTenantIdSchema(),
                                    ...ProductCtrl.getIdSchema()
                                })
                            },
                            handler: (request, h) => {
                                // TODO:  need to refactor this
                                return ProductCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************************
                     * Product variants
                     ******************************/
                     {
                        method: 'GET',
                        path: `${routePrefix}/product/variant`,
                        options: {
                            description: 'Gets a product variant',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required(),
                                    ...ProductCtrl.getWithRelatedSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductVariantCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/variant`,
                        options: {
                            description: 'Deletes a product variant',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return ProductVariantCtrl.deleteHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/variant/image`,
                        options: {
                            description: 'Deletes a product variant image',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    media_id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return ProductVariantCtrl.deleteImageHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/variant/sku`,
                        options: {
                            description: 'Gets a variant SKU',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductVariantSkuCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/variant/sku`,
                        options: {
                            description: 'Deletes a variant SKU',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid()
                                })
                            },
                            handler: (request, h) => {
                                return ProductVariantSkuCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************************
                     * Product Accent Messages
                     ******************************/
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/accent_messages`,
                        options: {
                            description: 'Gets a list of product accent messages',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid().required(),
                                    ...ProductAccentMessageCtrl.getPaginationSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductAccentMessageCtrl.fetchAllForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/accent_message`,
                        options: {
                            description: 'Gets a product accent message by ID',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductAccentMessageCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product/accent_message`,
                        options: {
                            description: 'Adds a new product accent message',
                            validate: {
                                payload: Joi.object({
                                    ...ProductAccentMessageCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductAccentMessageCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product/accent_message`,
                        options: {
                            description: 'Updates a product accent message',
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    ...ProductAccentMessageCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductAccentMessageCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/accent_message`,
                        options: {
                            description: 'Deletes a product accent message',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductAccentMessageCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************************
                     * Product Color Swatches
                     ******************************/
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/color_swatches`,
                        options: {
                            description: 'Gets a list of product color swatches',
                            handler: (request, h) => {
                                return ProductColorSwatchCtrl.fetchAllForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/color_swatch`,
                        options: {
                            description: 'Gets a product color swatch by ID',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductColorSwatchCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product/color_swatches`,
                        options: {
                            description: 'Adds a new product color swatch',
                            validate: {
                                payload: Joi.object({
                                    ...ProductColorSwatchCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductColorSwatchCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product/color_swatches`,
                        options: {
                            description: 'Updates a product color swatch',
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    ...ProductColorSwatchCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductColorSwatchCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/color_swatch`,
                        options: {
                            description: 'Deletes a product color swatch',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductColorSwatchCtrl.deleteHandler(request, h);
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
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid().required(),
                                    ...ProductCollectionCtrl.getPaginationSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductCollectionCtrl.fetchAllForTenantHandler(request, h);
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
                                return ProductCollectionCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product/collection`,
                        options: {
                            description: 'Adds a new product collection',
                            validate: {
                                payload: Joi.object({
                                    ...ProductCollectionCtrl.getSchema()
                                })
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
                     * Product Data Tables
                     ******************************/
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/data_table`,
                        options: {
                            description: 'Gets a product data table by ID',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductDataTableCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/data_tables`,
                        options: {
                            description: 'Gets a list of product data tables',
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid().required(),
                                    ...ProductDataTableCtrl.getPaginationSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductDataTableCtrl.fetchAllForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product/data_table`,
                        options: {
                            description: 'Adds a new product data table',
                            validate: {
                                payload: Joi.object({
                                    ...ProductDataTableCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductDataTableCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product/data_table`,
                        options: {
                            description: 'Updates a product data table',
                            validate: {
                                payload: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    ...ProductDataTableCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductDataTableCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/data_table`,
                        options: {
                            description: 'Deletes a product data table',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductDataTableCtrl.deleteHandler(request, h);
                            }
                        }
                    },


                    /******************************
                     * Product artist
                     ******************************/
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/artist`,
                        options: {
                            description: 'Gets a product artist by ID',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductArtistCtrl.fetchOneForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'GET',
                        path: `${routePrefix}/product/artists`,
                        options: {
                            description: 'Gets a list of product artist',
                            auth: {
                                strategies: ['storeauth', 'session']
                            },
                            validate: {
                                query: Joi.object({
                                    tenant_id: Joi.string().uuid().required(),
                                    ...ProductArtistCtrl.getPaginationSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductArtistCtrl.fetchAllForTenantHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'POST',
                        path: `${routePrefix}/product/artist`,
                        options: {
                            description: 'Adds a new product artist',
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
                                    ...ProductArtistCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductArtistCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'PUT',
                        path: `${routePrefix}/product/artist`,
                        options: {
                            description: 'Updates a product artist',
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
                                    id: Joi.string().uuid().required(),
                                    file: Joi.object(),
                                    ...ProductArtistCtrl.getSchema()
                                })
                            },
                            handler: (request, h) => {
                                return ProductArtistCtrl.upsertHandler(request, h);
                            }
                        }
                    },
                    {
                        method: 'DELETE',
                        path: `${routePrefix}/product/artist`,
                        options: {
                            description: 'Deletes a product artist',
                            validate: {
                                query: Joi.object({
                                    id: Joi.string().uuid().required(),
                                    tenant_id: Joi.string().uuid().required()
                                })
                            },
                            handler: (request, h) => {
                                return ProductArtistCtrl.deleteHandler(request, h);
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
                                strategies: ['storeauth', 'session']
                            }
                        },
                        handler: (request, h) => {
                            return ProductCtrl.sitemapHandler(request, h);
                        }
                    }
                ]);


                // REGISTERING EVENTS:
                //  server.event('CART_CHECKOUT_SUCCESS');


                // // DEFINING EVENT HANDLERS:
                // server.events.on(
                //     'CART_CHECKOUT_SUCCESS',
                //     ProductVariantSkuCtrl.decrementInventoryCount
                // );


                // LOADING BOOKSHELF MODELS:
                server.app.bookshelf.model(
                    'Product',
                    require('./models/Product')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductVariant',
                    require('./models/ProductVariant')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductVariantSku',
                    require('./models/ProductVariantSku')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductAccentMessage',
                    require('./models/ProductAccentMessage')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductColorSwatch',
                    require('./models/ProductColorSwatch')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductCollection',
                    require('./models/ProductCollection')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductDataTable',
                    require('./models/ProductDataTable')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );

                server.app.bookshelf.model(
                    'ProductArtist',
                    require('./models/ProductArtist')(server.app.bookshelfBaseModel, server.app.bookshelf, server)
                );
            }
        );
    }
};
