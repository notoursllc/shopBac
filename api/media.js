export default ($http) => ({

    async get(id) {
        const response = await $http.$get('/master_type', {
            searchParams: {
                id
            }
        });

        return response.data;
    },


    async postImage(File) {
        const formData = new FormData();
        formData.append('file', File);

        const response = await $http.$post(
            '/media/image',
            formData
        );

        return response.data;
    },


    async delete(id) {
        const response = await $http.$delete('/master_type', {
            searchParams: {
                id
            }
        });

        return response.data;
    }

});
