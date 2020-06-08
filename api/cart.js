import queryString from 'query-string';

export default ($http) => ({

    async updateItemQty(params) {
        return await this.$http.post('/cart/item/qty', params);
    },

    async deleteItem(id) {
        const { data } = await $http.$delete('/cart/item', {
            searchParams: {
                id
            }
        });

        return data;
    }

    // async list(params) {
    //     const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});

    //     // const response = await $http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
    //     const { data } = await $http.$get(`/taxes?${paramString}`); // TODO: is there a XSS issue here?
    //     return data;
    // },

    // async get(id) {
    //     const { data } = await $http.$get('/tax', {
    //         searchParams: {
    //             id
    //         }
    //     });

    //     return data;
    // },

    // async add(taxData) {
    //     const { data } = await $http.$post('/tax', taxData);
    //     return data;
    // },

    // async update(taxData) {
    //     const { data } = await $http.$put('/tax', taxData);
    //     return data;
    // },

    // async delete(id) {
    //     const { data } = await $http.$delete('/tax', {
    //         searchParams: {
    //             id
    //         }
    //     });

    //     return data;
    // }
});
