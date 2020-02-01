export default ($axios) => ({

    async register(userData) {
        const { data } = await $axios.$post('/tenant', userData);
        return data;
    }

    // async deleteImage(url) {
    //     let { data } = await $axios.$delete('/storage/image', {
    //         params: {
    //             url
    //         }
    //     });

    //     return data;
    // }

});
