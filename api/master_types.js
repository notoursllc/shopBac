import queryString from 'query-string';

export default ($http) => ({

    async all(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        const { data } = await $http.$get(`/master_types/all?${paramString}`); // TODO: is there a XSS issue here?
        return data;
    },


    async list(params) {
        const paramString = queryString.stringify(params, {arrayFormat: 'bracket'});
        const { data } = await $http.$get(`/master_types?${paramString}`); // TODO: is there a XSS issue here?
        return data;
    },


    async get(id) {
        const response = await $http.$get('/master_type', {
            searchParams: {
                id
            }
        });

        return response.data;
    },


    async upsert(data) {
        const response = await $http[data.hasOwnProperty('id') ? '$put' : '$post']('/master_type', data);
        return response.data;
    },


    async delete(id) {
        const response = await $http.$delete('/master_type', {
            searchParams: {
                id
            }
        });

        return response.data;
    },


    getNextAvailableTypeValue(allTypes) {
        let highestValue = 0;

        // find the highest value
        allTypes.forEach((obj) => {
            if(obj.value > highestValue) {
                highestValue = obj.value;
            }
        });

        let factor = 0;

        if(highestValue) {
            factor = parseInt(Math.log(highestValue) / Math.log(2), 10); // current factor
            factor++; // what the new factor should be
        }

        return Math.pow(2, factor);
    }
});
