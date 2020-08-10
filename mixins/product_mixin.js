import _forEach from 'lodash.foreach';
import isObject from 'lodash.isobject';

export default {
    methods: {
        goToProductDetails(id) {
            this.$router.push({
                name: 'product-id',
                params: { id }
            });
        },

        goToProductUpsert(productId) {
            this.$router.push({
                name: 'product-upsert-id',
                params: { id: productId }
            });
        },

        goToProductList() {
            this.$router.push({
                name: 'product-list'
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
                });
            }

            return pic;
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

        prodmix_getSmallestSkuImageMediaUrl(mediaObj) {
            let smallestWidth;
            let smallestUrl;

            if(isObject(mediaObj)) {
                smallestWidth = mediaObj.width || 9999;
                smallestUrl = mediaObj.url;

                if(Array.isArray(mediaObj.variants)) {
                    mediaObj.variants.forEach((variant) => {
                        if(variant.width < smallestWidth) {
                            smallestWidth = variant.width;
                            smallestUrl = variant.url;
                        }
                    });
                }
            }

            return smallestUrl;
        }
    }
};
