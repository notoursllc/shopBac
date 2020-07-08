<script>
import product_mixin from '@/mixins/product_mixin';


export default {
    components: {
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        Fab: () => import('@/components/Fab'),
        BooleanTag: () => import('@/components/BooleanTag')
    },

    mixins: [
        product_mixin
    ],

    data() {
        return {
            products: [],
            productSubTypes: [],
            sortData: {
                orderBy: 'updated_at',
                orderDir: 'DESC'
            },
            tableData: {
                headers: [
                    { key: 'featuredImage', label: null },
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
        async fetchProducts() {
            try {
                this.products = await this.$api.products.list({
                    // where: ['is_available', '=', true],
                    // whereRaw: ['sub_type & ? > 0', [productTypeId]],
                    // andWhere: [
                    //     ['total_inventory_count', '>', 0]
                    // ],
                    ...this.sortData
                });
            }
            catch(err) {
                this.$errorMessage(
                    err.message,
                    { closeOthers: true }
                );
            }
        },

        async fetchProductSubTypes() {
            this.productSubTypes = await this.$api.masterTypes.list('product_sub_type');
        },

        getSubTypeLabel(value) {
            const values = [];

            this.productSubTypes.forEach((obj) => {
                if(value & obj.value) {
                    values.push(
                        this.$t(obj.name)
                    );
                }
            });

            return values.join(', ');
        },

        sortChanged(val) {
            this.sortData.orderBy = val.prop || 'updated_at';
            this.sortData.orderDir = val.order === 'ascending' ? 'ASC' : 'DESC';
            this.fetchProducts();
        },

        async onProductDelete(product) {
            try {
                await this.$confirm(`Delete product "${product.title}"?`, 'Please confirm', {
                    confirmButtonText: 'OK',
                    cancelButtonText: 'Cancel',
                    type: 'warning'
                });

                try {
                    await this.$api.products.delete(product.id)
                    this.$successMessage(`"${product.title}" deleted successfully`);
                    this.fetchProducts();
                }
                catch(e) {
                    this.$errorMessage(
                        e.message,
                        { closeOthers: true }
                    );
                }
            }
            catch(err) {
                // Do nothing when the confirm is cancelled
            }
        },

        numberOfPicsInProduct(product) {
            let count = 0;

            if(Array.isArray(product.variations)) {
                product.variations.forEach((variation) => {
                    if(variation.published && Array.isArray(variation.pics)) {
                        variation.pics.forEach((pic) => {
                            if(pic.is_visible) {
                                count++;
                            }
                        });
                    }
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
        }
    }
};
</script>


<template>
    <div>
        <fab type="add" @click="goToProductUpsert" />

        <b-table
            :items="products"
            :fields="tableData.headers"
            borderless
            striped
            hover>

            <!-- featured image -->
            <template v-slot:cell(featuredImage)="row">
                <template v-if="featuredProductPic(row.value)">
                    <img
                        :src="featuredProductPic(row.value)"
                        alt="Image"
                        class="prodPicSmall">
                    <div class="fs12"># pictures: {{ numberOfPicsInProduct(row.value) }}</div>
                </template>
            </template>

            <!-- title -->
            <template v-slot:cell(title)="row">
                {{ row.item.title }}
                <operations-dropdown
                    :show-edit="false"
                    @view="goToProductUpsert(row.item.id)"
                    @delete="onProductDelete(row.item)" />
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
        </b-table>
    </div>
</template>


<style lang="scss">
    .prodPicSmall {
        width: 70px;
    }
</style>
