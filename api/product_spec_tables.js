import queryString from 'query-string';

export default ($http) => ({

    async all(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        const { data } = await $http.$get(`/product/spec_tables/all?${paramString}`);
        return data;
    },


    async list(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        const { data } = await $http.$get(`/product/spec_tables?${paramString}`);
        return data;
    },


    async get(id) {
        const response = await $http.$get('/product/spec_table', {
            searchParams: {
                id
            }
        });

        return response.data;
    },


    async upsert(data) {
        const response = await $http[data.hasOwnProperty('id') ? '$put' : '$post']('/product/spec_table', data);
        return response.data;
    },


    async delete(id) {
        const response = await $http.$delete('/product/spec_table', {
            searchParams: {
                id
            }
        });

        return response.data;
    }

});
