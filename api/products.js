import queryString from 'query-string';
import isObject from 'lodash.isobject';
import cloneDeep from 'lodash.clonedeep';


function stripRelations(data) {
    // delete data.skus;
    // delete data.images;
    delete data.created_at;
    delete data.updated_at;
    delete data.deleted_at;
    delete data.total_inventory_count;
}


export default ($http) => ({

    async list(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});

        // const response = await $http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
        const { data } = await $http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
        return data;
    },


    async getBySeoUri(str) {
        const { data } = await $http.$get('/product/seo', {
            searchParams: {
                id: str
            }
        });

        return data;
    },


    async get(id, options) {
        let searchParams = {};

        if(isObject(options)) {
            searchParams = {
                ...options
            };
        }

        searchParams.id = id;

        const { data } = await $http.$get('/product', {
            searchParams
        });

        return data;
    },


    async upsert(data) {
        const prod = cloneDeep(data);
        stripRelations(prod);

        const response = await $http[prod.id ? '$put' : '$post']('/product', prod);
        return response.data;
    },


    async delete(id) {
        const { data } = await $http.$delete('/product', {
            searchParams: {
                id
            }
        });
        return data;
    },


    async deleteImage(id) {
        const { data } = await $http.$delete('/product/image', {
            searchParams: {
                id
            }
        });
        return data;
    },


    /*
    * Collections
    */
    async listProductCollections() {
        const { data } = await $http.$get('/collections');
        return data;
    },


    async getProductCollection(id) {
        const { data } = await $http.$get('/collection', {
            searchParams: {
                id
            }
        });

        return data;
    },


    async upsertProductCollection(data) {
        const response = await $http[data.hasOwnProperty('id') ? '$put' : '$post']('/collection', data);
        return response.data;
    },


    async deleteProductCollection(id) {
        const { data } = await $http.$delete('/collection', {
            searchParams: {
                id
            }
        });

        return data;
    }

});
