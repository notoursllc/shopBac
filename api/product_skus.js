export default ($http) => ({

    async delete(id) {
        const { data } = await $http.$delete('/product/sku', {
            searchParams: {
                id
            }
        });
        return data;
    },


    async deleteImage(id) {
        const { data } = await $http.$delete('/product/sku/image', {
            searchParams: {
                id
            }
        });
        return data;
    }
});
