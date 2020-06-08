import queryString from 'query-string';

export default ($http) => ({

    async listPackageTypes(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});

        // const response = await $http.$get(`/products?${paramString}`); // TODO: is there a XSS issue here?
        const { data } = await $http.$get(`/shipping/packagetypes?${paramString}`); // TODO: is there a XSS issue here?
        return data;
    },

    async deletePackageType(id) {
        const { data } = await $http.$delete('/shipping/packagetype', {
            searchParams: {
                id
            }
        });

        return data;
    }

});
