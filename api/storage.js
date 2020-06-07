export default ($http) => ({

    // https://www.npmjs.com/package/ky#tips
    async addImage(FormData) {
        const { data } = await $http.$post('/storage/image', {
            body: FormData
        });
        return data;
    },


    async deleteImage(url) {
        const { data } = await $http.$delete('/storage/image', {
            searchParams: {
                url
            }
        });

        return data;
    }

});
