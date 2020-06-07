export default ($http) => ({

    async addImage(FormData) {
        const { data } = await $http.$post('/storage/image', FormData);
        return data;
    },

    async deleteImage(url) {
        let { data } = await $http.$delete('/storage/image', {
            params: {
                url
            }
        });

        return data;
    }

});
