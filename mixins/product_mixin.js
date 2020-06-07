'use strict';

import queryString from 'query-string';
import _forEach from 'lodash.foreach';
import isObject from 'lodash.isobject';


function stripRelations(productJson) {
    delete productJson.artist;
    delete productJson.sizes;
    delete productJson.pics;
    delete productJson.tax;
    delete productJson.variations;
    delete productJson.package_type;

    // also strip uneditable values:
    delete productJson.created_at;
    delete productJson.updated_at;
    delete productJson.display_price;
    delete productJson.total_inventory_count;

    return productJson;
}


export default {
    methods: {
        async getProducts(params) {
            const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});

            // const response = await this.$http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
            const response = await this.$http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
            return response.data;
        },


        async getAdminProducts(params) {
            const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});

            // const response = await this.$http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
            const response = await this.$http.$get(`/admin/products?${paramString}`); // TODO: is there a XSS issue here?
            return response.data;
        },


        async getProductInfo() {
            const response = await this.$http.$get('/product/info');
            return response.data;
        },


        async getProductBySeoUri(str) {
            const response = await this.$http.$get('/product/seo', {
                params: {
                    id: str
                }
            });
            return response.data;
        },


        async getProductById(id, options) {
            let params = {};

            if(isObject(options)) {
                params = {
                    ...options
                };
            }

            params.id = id;

            const response = await this.$http.$get('/product', {
                params
            });
            return response.data;
        },


        async deleteProduct(id) {
            const response = await this.$http.$delete(`/product`, {
                params: {
                    id
                }
            });
            return response.data;
        },


        async getProductArtists(params) {
            let paramString = queryString.stringify(params, {arrayFormat: 'bracket'});

            const response = await this.$http.$get(`/artists?${paramString}`); // TODO: is there a XSS issue here?
            return response.data;
        },


        async getProductArtistById(artistId) {
            const response = await this.$http.$get('/artist', {
                params: {
                    id: artistId
                }
            });

            return response.data;
        },

        async upsertProductArtist(artist) {
            let response;

            if(artist.id) {
                response = await this.$http.$put('/artist', artist);
            }
            else {
                response = await this.$http.$post('/artist', artist);
            }

            return response.data;
        },

        async deleteProductArtist(artistId) {
            const response = await this.$http.$delete('/artist', {
                params: {
                    id: artistId
                }
            });

            return response.data;
        },


        async getProductsForArtist(artistId) {
            const response = await this.$http.$get('/artist/products', {
                params: {
                    id: artistId
                }
            });

            return response;
        },


        async prodmix_variations(product_id) {
            const response = await this.$http.$get('/product/variations', {
                params: {
                    product_id
                }
            });

            return response.data;
        },


        /******************************
         * Navigation
         ******************************/

        goToProductDetails(seo_uri) {
            this.$router.push({
                name: 'p-seouri',
                params: { seouri: seo_uri }
            });
        },


        goToAdminProductDetails(id) {
            this.$router.push({
                name: 'product-id',
                params: { id }
            });
        },


        goToAdminProductUpsert(productId) {
            this.$router.push({
                name: 'product-upsert-id',
                params: { id: productId }
            });
        },


        goToAdminProductAdd() {
            return this.$router.push({
                name: 'product-upsert-id'
            });
            // return this.$router.push({
            //     name: 'product-upsert-id'
            // });
        },


        goToAdminProductList() {
            this.$router.push({
                name: 'product-list'
            });
        },


        goToProductArtistList() {
            this.$router.push({
                name: 'product-artist-list'
            });
        },


        goToProductArtistUpsert(id) {
            this.$router.push({
                name: 'product-artist-upsert-id',
                params: { id }
            });
        },


        featuredProductPic(product) {
            let pic = null;

            if(Array.isArray(product.variations)) {
                product.variations.forEach((variation) => {
                    if(variation.published && Array.isArray(variation.pics)) {
                        const len = variation.pics.length;

                        // The related pics for a product variant are ordered by sort order (ASC)
                        // so the first 'is_visible' pic will be the featured pic
                        for(let i = 0; i < len; i++) {
                            if(variation.pics[i].is_visible) {
                                pic = variation.pics[i].url;
                                break;
                            }
                        }
                    }
                })
            }

            return pic;
        },


        async upsertProduct(product) {
            let response;
            const cleanProduct = stripRelations(product);

            if(product.id) {
                response = await this.$http.$put('/product', cleanProduct);
            }
            else {
                response = await this.$http.$post('/product', cleanProduct);
            }

            return response.data;
        },


        buildPictures(product) {
            const sortObj = {};
            const added = [];

            function add(sortOrder, val) {
                const order = sortOrder || 100;

                if (added.indexOf(val) === -1) {
                    added.push(val);

                    if(!sortObj.hasOwnProperty(order)) {
                        sortObj[order] = [];
                    }

                    sortObj[order].push(val);
                }
            }

            function getSortedArray(sortObj) {
                const vals = [];

                _forEach(sortObj, (arr) => {
                    if(Array.isArray(arr)) {
                        arr.forEach((val) => {
                            vals.push(val);
                        });
                    }
                });

                return vals;
            }

            return new Promise((resolve, reject) => {
                if (Array.isArray(product.pics)) {
                    product.pics.forEach((obj) => {
                        if (obj.is_visible && obj.url) {
                            add(obj.sort_order, obj.url);
                        }
                    });
                }

                resolve(getSortedArray(sortObj));
            });
        },


        /******************************
         * Product Sizes
         ******************************/

        // TODO: refactor this to get size options from product variation
        buildSizeOptions(product) {
            const sizeOpts = [];
            let maxInventoryCount = 0;

            if (isObject(product) && Array.isArray(product.sizes)) {
                product.sizes.forEach((obj) => {
                    if (obj.is_visible && obj.inventory_count) {
                        sizeOpts.push(obj.size);

                        if (obj.total_inventory_count > maxInventoryCount) {
                            maxInventoryCount = obj.inventory_count;
                        }
                    }
                });
            }

            return {
                sizeOpts,
                maxInventoryCount
            };
        },


        async buildMissingSizeOptions(sizes) {
            const productInfo = await this.getProductInfo();

            if(!productInfo) {
                throw new Error(this.$t('Product sizes not found'));
            }

            let usedSizeIds = [];
            let options = [];

            if(Array.isArray(sizes)) {
                sizes.forEach((size) => {
                    usedSizeIds.push(size.size);
                });
            }

            productInfo.sizes.forEach((id) => {
                if (usedSizeIds.indexOf(id) === -1) {
                    options.push(id);
                }
            });

            return options;
        },


        getInventoryCountForSize(selectedSize, product) {
            let inventoryCount = null;

            if(selectedSize && Array.isArray(product.sizes)) {
                product.sizes.forEach((size) => {
                    if(selectedSize === size.size && size.hasOwnProperty('inventory_count')) {
                        inventoryCount = size.inventory_count;
                    }
                });
            }

            return inventoryCount;
        },


        async upsertProductSize(size) {
            let uri = '/product/size/create';

            if(size.id) {
                uri = '/product/size/update';
            }

            delete size.updated_at;
            delete size.created_at;

            const response = await this.$http.$post(uri, size);
            return response.data;
        },


        async deleteProductSize(id) {
            const response = await this.$http.$delete('/product/size', {
                params: {
                    id
                }
            });
            return response.data;
        },


        /******************************
         * Product Pictures
         ******************************/

        async upsertProductPicture(formData) {
            const response = await this.$http.$post(
                '/product/pic',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return response.data;
        },


        async deleteProductPicture(id) {
            const response = await this.$http.$delete('/product/pic', {
                params: {
                    id
                }
            });
            return response.data;
        }

    }
};
