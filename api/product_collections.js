import queryString from 'query-string';
import cloneDeep from 'lodash.clonedeep';


function stripRelations(data) {
    delete data.created_at;
    delete data.updated_at;
    delete data.deleted_at;
}


export default ($http) => ({

    async list(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        const { data } = await $http.$get(`/product/collections?${paramString}`); // TODO: is there a XSS issue here?
        return data;
    },

    async get(id) {
        const response = await $http.$get('/product/collection', {
            searchParams: {
                id
            }
        });

        return response.data;
    },

    async upsert(data) {
        const prod = cloneDeep(data);
        stripRelations(prod);

        const response = await $http[prod.id ? '$put' : '$post']('/product/collection', prod);
        return response.data;
    },


    async delete(id) {
        const { data } = await $http.$delete('/product/collection', {
            searchParams: {
                id
            }
        });
        return data;
    }

});
