export default ($http) => ({

    async list(object) {
        const { data } = await $http.$get('/master_types', {
            params: {
                object
            }
        });
        return data;
    },


    async get(id) {
        const response = await $http.$get('/master_type', {
            params: {
                id
            }
        });

        return response.data;
    },


    async upsert(data) {
        let response;

        if(data.hasOwnProperty('id')) {
            response = await $http.$put('/master_type', data);
        }
        else {
            response = await $http.$post('/master_type', data);
        }

        return response.data;
    },


    async delete(id) {
        const response = await $http.$delete('/master_type', {
            params: {
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
})
