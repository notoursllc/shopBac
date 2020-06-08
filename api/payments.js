import queryString from 'query-string';

export default ($http) => ({

    async list(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});

        // const response = await $http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
        const { data } = await $http.$get(`/payments?${paramString}`); // TODO: is there a XSS issue here?
        return data;
    },

    async get(id) {
        const { data } = await $http.$get('/payment', {
            searchParams: {
                id
            }
        });

        return data;
    },

    async createPackingSlip(paymentId) {
        const { data } = await this.$http.$post('/payment/shipping/packingslip', {
            id: paymentId
        });
        return data;
    },

    async purchaseShippingLabel(paymentData) {
        const { data } = await this.$http.$post('/payment/shipping/label', paymentData);
        return data;
    },

    async getShippingLabel(id) {
        const { data } = await $http.$get('/payment/shipping/label', {
            searchParams: {
                id
            }
        });

        return data;
    },

    async deleteShippingLabel(id) {
        const { data } = await $http.$delete('/payment/shipping/label', {
            searchParams: {
                id
            }
        });

        return data;
    }

});
