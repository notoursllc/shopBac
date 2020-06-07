import queryString from 'query-string';
import isObject from 'lodash.isobject';
import cloneDeep from 'lodash.clonedeep';


function stripRelations(data) {
    delete data.skus;
    delete data.images;
    delete data.created_at;
    delete data.updated_at;
    delete data.deleted_at;
    delete data.total_inventory_count;
}


export default ($http) => ({

    // was getProducts
    async list(params) {
        let paramString = queryString.stringify(params, {arrayFormat: 'bracket'});

        // const response = await $http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
        const { data } = await $http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
        return data;
    },


    // TODO: remove
    async getProductInfo() {
        const { data } = await $http.$get('/product/info');
        return data;
    },


    // was getProductBySeoUri
    async getBySeoUri(str) {
        const { data } = await $http.$get('/product/seo', {
            params: {
                id: str
            }
        });
        return data;
    },


    // was getProductById
    async get(id, options) {
        let params = {};

        if(isObject(options)) {
            params = {
                ...options
            };
        }

        params.id = id;

        const { data } = await $http.$get('/product', {
            params
        });
        return data;
    },


    async upsert(data) {
        let response;
        let prod = cloneDeep(data);

        stripRelations(prod);

        if(prod.id) {
            response = await $http.$put('/product', prod);
        }
        else {
            response = await $http.$post('/product', prod);
        }

        return response.data;
    },


    // was deleteProduct
    async delete(id) {
        const { data } = await $http.$delete(`/product`, {
            params: {
                id
            }
        });
        return data;
    },


    async upsertImage(formData) {
        const { data } = await $http.$post('/product/image', formData);
        return data;
    },


    async deleteImage(id) {
        const { data } = await $http.$delete(`/product/image`, {
            params: {
                id
            }
        });
        return data;
    },


    //////////////////
    // Collections
    //////////////////
    async listProductCollections() {
        const { data } = await $http.$get('/collections');
        return data;
    },


    async getProductCollection(id) {
        const { data }  = await $http.$get('/collection', {
            params: {
                id
            }
        });

        return data;
    },


    async upsertProductCollection(data) {
        let response;

        if(data.hasOwnProperty('id')) {
            response = await $http.$put('/collection', data);
        }
        else {
            response = await $http.$post('/collection', data);
        }

        return response.data;
    },


    async deleteProductCollection(id) {
        const { data } = await $http.$delete('/collection', {
            params: {
                id
            }
        });

        return data;
    }

});
