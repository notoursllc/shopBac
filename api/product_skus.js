import cloneDeep from 'lodash.clonedeep';


function stripRelations(data) {
    delete data.is_displayable;
    delete data.images;
    delete data.created_at;
    delete data.updated_at;
    delete data.deleted_at;
}


export default ($http) => ({

    async upsert(data) {
        const sku = cloneDeep(data);
        stripRelations(sku);

        const response = await $http[sku.id ? '$put' : '$post']('/product/sku', sku);
        return response.data;
    },


    async delete(id) {
        const { data } = await $http.$delete('/product/sku', {
            searchParams: {
                id
            }
        });
        return data;
    },


    async upsertImage(imgData) {
        const { data } = await $http.$post('/product/sku/image', imgData);
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
