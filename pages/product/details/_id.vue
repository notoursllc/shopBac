<script>
import product_mixin from '@/mixins/product_mixin';
import alerts_mixin from '@/mixins/alerts_mixin';

export default {
    components: {
        ProductDetailsJsonView: () => import('@/components/product/ProductDetailsJsonView'),
        Fab: () => import('@/components/Fab')
    },

    mixins: [
        product_mixin,
        alerts_mixin
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
            this.errorMessage(e.message);
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
        <fab type="edit" @click="goToEdit" />

        <product-details-json-view :product="product"></product-details-json-view>
    </div>
</template>
