<script>
import product_mixin from '@/mixins/product_mixin';

export default {
    components: {
        ProductDetailsJsonView: () => import('@/components/product/ProductDetailsJsonView'),
        Fab: () => import('@/components/Fab')
    },

    mixins: [
        product_mixin
    ],

    data() {
        return {
            product: {}
        };
    },

    async created() {
        try {
            this.product = await this.$api.products.get(this.$route.params.id);

            if(!this.product) {
                throw new Error(this.$t('Product not found'));
            }
        }
        catch(e) {
            this.$errorToast(e.message);
        }
    },

    methods: {
        goToEdit() {
            this.$router.push({
                name: 'product-upsert-id',
                params: { id: this.product.id }
            });
        }
    }
};
</script>


<template>
    <div>
        <fab icon="edit" @click="goToEdit" />

        <product-details-json-view :product="product"></product-details-json-view>
    </div>
</template>
