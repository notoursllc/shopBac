<script>
export default {
    components: {
        AppTable: () => import('@/components/AppTable')
    },

    data() {
        return {
            products: [],
            sortData: {
                orderBy: 'updated_at',
                orderDir: 'DESC'
            },
            tableData: {
                headers: [
                    { key: 'updated_at', label: this.$t('Updated'), sortable: true },
                    { key: 'updated_at', label: this.$t('Status') },
                    { key: 'updated_at', label: this.$t('Shipping total') },
                    { key: 'updated_at', label: this.$t('Grand total') }
                ]
            }
        };
    },

    async asyncData({ params, store, app }) {
        const payments = await app.$api.payments.list.call(app, {
            // where: ['is_available', '=', true],
            // andWhere: [
            //     ['total_inventory_count', '>', 0]
            // ],
            orderBy: 'updated_at',
            orderDir: 'DESC'
        });

        return {
            payments
        };
    },

    methods: {
        async fetchOrders() {
            this.payments = await this.$api.payments.list({
                // where: ['is_available', '=', true],
                // whereRaw: ['sub_type & ? > 0', [productTypeId]],
                // andWhere: [
                //     ['total_inventory_count', '>', 0]
                // ],
                ...this.sortData
            });
        },

        sortChanged(val) {
            this.sortData.orderBy = val.prop || 'updated_at';
            this.sortData.orderDir = val.order === 'ascending' ? 'ASC' : 'DESC';
            this.fetchOrders();
        }
    }
};
</script>


<template>
    <app-table
        :items="payments"
        :fields="tableData.headers"
        @sort-changed="sortChanged">

        <template v-slot:cell(updated_at)="row">
            <nuxt-link
                :to="{ name: 'order-id', params: { id: row.item.id } }"
                tag="a">{{ row.item.updated_at | format8601 }}</nuxt-link>
        </template>

        <!-- success -->
        <template v-slot:cell()="row">
            <div v-for="obj in row.item.transaction.tenders" :key="obj.id">
                {{ obj.card_details.status }}
            </div>
        </template>

        <!-- shipping total -->
        <template v-slot:cell()="row">
            {{ row.item.shoppingCart.shipping_total }}
        </template>

        <!-- grand total -->
        <template v-slot:cell()="row">
            {{ row.item.shoppingCart.grand_total }}
        </template>
    </app-table>
</template>


<style lang="scss">
    @import "~assets/css/components/_table.scss";

    .prodPicSmall {
        width: 70px;
    }
</style>
