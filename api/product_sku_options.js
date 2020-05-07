import queryString from 'query-string';
import cloneDeep from 'lodash.clonedeep';


function stripRelations(data) {
    delete data.created_at;
    delete data.updated_at;
    delete data.deleted_at;
}


export default ($axios) => ({

    list(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        return $axios.$get(`/product/sku/options?${paramString}`); // TODO: is there a XSS issue here?
    },


    async get(id) {
        const { data } = await $axios.$get('/product/sku/option', {
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
            response = await $axios.$put('/product/sku/option', prod);
        }
        else {
            response = await $axios.$post('/product/sku/option', prod);
        }

        return response.data;
    },

    async delete(id) {
        const { data } = await $axios.$delete('/product', {
            params: {
                id
            }
        });
        return data;
    }

});
