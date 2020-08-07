<script>
import product_mixin from '@/mixins/product_mixin';

export default {
    components: {
        AppTable: () => import('@/components/AppTable'),
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        Fab: () => import('@/components/Fab'),
        BooleanTag: () => import('@/components/BooleanTag'),
        Vnodes: () => import('@/components/Vnodes')
    },

    mixins: [
        product_mixin
    ],

    data() {
        return {
            products: [],
            productSubTypes: [],
            tableData: {
                headers: [
                    { key: 'featuredImage', label: '', thClass: ['width125'] },
                    { key: 'title', label: this.$t('Title'), sortable: true, sortDirection: 'desc' },
                    { key: 'inventory', label: this.$t('Inventory') },
                    { key: 'published', label: this.$t('Published'), sortable: true },
                    { key: 'sub_type', label: this.$t('Sub Type'), sortable: true },
                    { key: 'vendor', label: this.$t('Vendor') }
                ]
            }
        };
    },

    async created() {
        await Promise.all([
            this.fetchProducts(),
            this.fetchProductSubTypes()
        ]);
    },

    methods: {
        async fetchProducts(paramsObj) {
            try {
                this.products = await this.$api.products.list(paramsObj);
            }
            catch(err) {
                this.$errorToast(err.message);
            }
        },

        async fetchProductSubTypes() {
            this.productSubTypes = await this.$api.masterTypes.all({
                where: ['object', '=', 'product_sub_type']
            });
        },

        getSubTypeLabel(value) {
            const values = [];

            this.productSubTypes.forEach((obj) => {
                if(value & obj.value) {
                    values.push(obj.name);
                }
            });

            return values.join(', ');
        },

        sortChanged(val) {
            this.fetchProducts(val);
        },

        async onProductDelete(product) {
            const confirmed = await this.$confirmModal(
                `Delete product "${product.title}"?`,
                'warning'
            );

            if(!confirmed) {
                return;
            }

            try {
                await this.$api.products.delete(product.id);
                this.$successToast(`"${product.title}" deleted successfully`);
                this.fetchProducts();
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        getNumPublishedPics(product) {
            let count = 0;

            const reducer = (accumulator, currentObj) => {
                return currentObj.published ? accumulator + 1 : accumulator;
            };

            if(Array.isArray(product.images)) {
                count += product.images.reduce(reducer, 0);
            }

            if(Array.isArray(product.skus)) {
                product.skus.forEach((sku) => {
                    count += sku.images.reduce(reducer, 0);
                });
            }

            return count;
        },


        getInventoryCountString(prod) {
            const numVariants = Array.isArray(prod.variants) ? prod.variants.length : 0;
            const totalInventoryCount = prod.total_inventory_count || 0;

            if(numVariants) {
                return this.$tc(
                    'n_in_stock_for_n_variants',
                    numVariants,
                    { numInventory: totalInventoryCount, numVariants: numVariants }
                );
            }

            return this.$t('n_in_stock', { numInventory: totalInventoryCount })
        },


        getFirstVariantImage(product) {
            let url = null;
            let altText = null;
            let smallestWidth = 0;

            // To make sure we only get the first published image
            let publishedImage = null;

            if(Array.isArray(product.skus)) {
                product.skus.forEach((sku) => {
                    if(Array.isArray(sku.images)) {
                        sku.images.forEach((img) => {
                            if(!publishedImage && img.published) {
                                publishedImage = img;

                                // the first published image is the baseline.
                                smallestWidth = publishedImage.width;
                                url = publishedImage.image_url;
                                altText = publishedImage.alt_text;

                                // now check to see if any of it's variants are smaller
                                if(Array.isArray(publishedImage.variants)) {
                                    publishedImage.variants.forEach((variant) => {
                                        if(variant.width < smallestWidth) {
                                            smallestWidth = variant.width;
                                            url = variant.image_url;
                                            // NOTE: variants do not have a separate alt_text property
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }

            if(url) {
                const h = this.$createElement;
                return h(
                    'img',
                    {
                        attrs: {
                            src: url,
                            alt: altText
                        },
                        class: ['prodPicSmall']
                    }
                );
            }
        },

        numPicsLabel(product) {
            const numPublishedPics = this.getNumPublishedPics(product);
            return this.$tc('n_pictures', numPublishedPics, { num: numPublishedPics });
        }
    }
};
</script>


<template>
    <div>
        <fab icon="plus" @click="goToProductUpsert" />

        <app-table
            :items="products"
            :fields="tableData.headers"
            @column-sort="sortChanged">

            <!-- featured image -->
            <template v-slot:cell()="row">
                <vnodes :vnodes="getFirstVariantImage(row.item)" />
                <div class="fs12">{{ numPicsLabel(row.item) }}</div>
            </template>

            <!-- title -->
            <template v-slot:cell(title)="row">
                {{ row.item.title }}
                <operations-dropdown
                    :show-view="false"
                    @edit="goToProductUpsert(row.item.id)"
                    @delete="onProductDelete(row.item)"
                    class="mls" />
            </template>

            <!-- inventory count -->
            <template v-slot:cell(inventory)="row">
                {{ getInventoryCountString(row.item) }}
            </template>

            <!-- published -->
            <template v-slot:cell(published)="row">
                <boolean-tag :value="row.item.published" />
            </template>

            <!-- sub-type -->
            <template v-slot:cell(sub_type)="row">
                {{ getSubTypeLabel(row.item.sub_type) }}
            </template>

            <!-- vendor -->
            <template v-slot:cell(vendor)="row">
                {{ row.item.vendor }}
            </template>
        </app-table>
    </div>
</template>


<style lang="scss">
    .prodPicSmall {
        width: 50px;
    }
</style>
