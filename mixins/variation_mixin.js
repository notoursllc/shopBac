export default {
    methods: {
        async varimix_search() {
            const response = await this.$http.$get('/variations');
            return response.data;
        },


        async varimix_get(id) {
            const response = await this.$http.$get('/variation', {
                params: {
                    id
                }
            });

            return response.data;
        },


        async varimix_upsert(data) {
            let response;

            if(data.id) {
                response = await this.$http.$put('/variation', data);
            }
            else {
                response = await this.$http.$post('/variation', data);
            }

            return response.data;
        },


        async varimix_update(data) {
            let response = await this.$http.$put('/variation', data);
            return response.data;
        },


        async varimix_delete(id) {
            const response = await this.$http.$delete('/variation', {
                params: {
                    id
                }
            });

            return response.data;
        },


        async varimix_options(product_variation_id) {
            const response = await this.$http.$get('/variation/options', {
                params: {
                    product_variation_id
                }
            });

            return response.data;
        },


        getFeaturedPic(variation) {
            if(Array.isArray(variation.pics) && variation.pics[0]) {
                return variation.pics[0].url;
            }
        }


        // varimix_goToList() {
        //     this.$router.push({
        //         name: 'tax-list'
        //     });
        // },

        // varimix_goToUpsert(id) {
        //     this.$router.push({
        //         name: 'tax-upsert-id',
        //         params: { id: id }
        //     });
        // },
    }
}
