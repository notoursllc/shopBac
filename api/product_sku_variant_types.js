import queryString from 'query-string';
import cloneDeep from 'lodash.clonedeep';


function stripRelations(data) {
    delete data.created_at;
    delete data.updated_at;
    delete data.deleted_at;
}


export default ($http) => ({

    list(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        return $http.$get(`/product/sku/variant_types?${paramString}`); // TODO: is there a XSS issue here?
    },


    async get(id) {
        const { data } = await $http.$get('/product/sku/variant_type', {
            params: {
                id
            }
        });
        return data;
    },


    async upsert(data) {
        let response;
        const prod = cloneDeep(data);

        stripRelations(prod);

        if(prod.id) {
            response = await $http.$put('/product/sku/variant_type', prod);
        }
        else {
            response = await $http.$post('/product/sku/variant_type', prod);
        }

        return response.data;
    },

    async delete(id) {
        const { data } = await $http.$delete('/product/sku/variant_type', {
            params: {
                id
            }
        });
        return data;
    }

});
