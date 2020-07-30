import queryString from 'query-string';

export default ($http) => ({

    async all(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        const { data } = await $http.$get(`/product/data_tables/all?${paramString}`);
        return data;
    },


    async list(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        const { data } = await $http.$get(`/product/data_tables?${paramString}`);
        return data;
    },


    async get(id) {
        const response = await $http.$get('/product/data_table', {
            searchParams: {
                id
            }
        });

        return response.data;
    },


    async upsert(data) {
        const response = await $http[data.hasOwnProperty('id') ? '$put' : '$post']('/product/data_table', data);
        return response.data;
    },


    async delete(id) {
        const response = await $http.$delete('/product/data_table', {
            searchParams: {
                id
            }
        });

        return response.data;
    }

});
