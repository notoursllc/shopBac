import cloneDeep from 'lodash.clonedeep';


function stripRelations(data) {
    delete data.is_displayable;
    delete data.images;
    delete data.created_at;
    delete data.updated_at;
    delete data.deleted_at;
}


export default ($axios) => ({

    async upsert(data) {
        let response;
        const sku = cloneDeep(data);

        stripRelations(sku);

        if(sku.id) {
            response = await $axios.$put('/product/sku', sku);
        }
        else {
            response = await $axios.$post('/product/sku', sku);
        }

        return response.data;
    },


    async delete(id) {
        const { data } = await $axios.$delete('/product/sku', {
            params: {
                id
            }
        });
        return data;
    },


    async upsertImage(imgData) {
        const { data } = await $axios.$post('/product/sku/image', imgData);
        return data;
    },


    async deleteImage(id) {
        const { data } = await $axios.$delete('/product/sku/image', {
            params: {
                id
            }
        });
        return data;
    }
});
