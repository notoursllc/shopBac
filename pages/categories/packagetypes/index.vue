<script>
import shipping_mixin from '@/mixins/shipping_mixin';

export default {
    components: {
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        Fab: () => import('@/components/Fab'),
        AppTable: () => import('@/components/AppTable')
        // ShippingPackageTypeUpsertForm: () => import('@/components/shipping/ShippingPackageTypeUpsertForm')
    },

    mixins: [
        shipping_mixin
    ],

    data() {
        return {
            dialog: {
                show: false,
                packageTypeId: null
            },
            shippingPackageTypes: [],
            tableData: {
                headers: [
                    { key: 'label', label: this.$t('Label'), sortable: true },
                    { key: 'length', label: this.$t('Length'), sortable: true },
                    { key: 'width', label: this.$t('Width'), sortable: true },
                    { key: 'height', label: this.$t('Height'), sortable: true },
                    { key: 'distance_unit', label: this.$t('Distance Unit'), sortable: true },
                    { key: 'weight', label: this.$t('Weight (oz)'), sortable: true }
                ]
            }
        };
    },

    created() {
        this.fetchPackageTypes();
    },

    methods: {
        async fetchPackageTypes(paramsObj) {
            try {
                this.shippingPackageTypes = await this.$api.shipping.listPackageTypes(paramsObj);
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        sortChanged(val) {
            this.fetchPackageTypes(val);
        },

        async deleteType(data) {
            const confirmed = await this.$confirmModal(
                `Remove this package type? "${data.label}"`,
                'warning'
            );

            if(!confirmed) {
                return;
            }

            try {
                const packageTypeJson = await this.$api.shipping.deletePackageType(data.id);

                if(!packageTypeJson) {
                    throw new Error(this.$t('Package Type not found'));
                }

                this.fetchPackageTypes();
                this.$successToast(`Package Type deleted: ${data.label}`);
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        onUpsertClick(id) {
            this.dialog.packageTypeId = id || null;
            this.dialog.show = true;
        },

        onUpsertSuccess() {
            this.dialog.show = false;
            this.fetchPackageTypes();
        }
    }
};
</script>


<template>
    <div>
        <fab icon="plus" @click="onUpsertClick" />

        <app-table
            :items="shippingPackageTypes"
            :fields="tableData.headers"
            @column-sort="sortChanged">

            <!-- label -->
            <template v-slot:cell(label)="row">
                {{ row.item.label }}
                <operations-dropdown
                    :show-view="false"
                    @edit="onUpsertClick(row.item.id)"
                    @delete="deleteType(row.item)"
                    class="mls" />
            </template>

            <!-- length -->
            <template v-slot:cell(length)="row">
                {{ row.item.length }}
            </template>

            <!-- width -->
            <template v-slot:cell(width)="row">
                {{ row.item.width }}
            </template>

            <!-- height -->
            <template v-slot:cell(height)="row">
                {{ row.item.height }}
            </template>

            <!-- distance unit -->
            <template v-slot:cell(distance_unit)="row">
                {{ row.item.distance_unit }}
            </template>

            <!-- weight -->
            <template v-slot:cell(weight)="row">
                {{ row.item.weight }}
            </template>
        </app-table>

        <!-- <el-dialog
            :visible.sync="dialog.show"
            :destroy-on-close="true"
            width="95%"
            top="5vh"> -->
            <!-- <shipping-package-type-upsert-form
                :id="dialog.packageTypeId"
                @success="onUpsertSuccess"
                @cancel="dialog.show = false" /> -->
        <!-- </el-dialog> -->

    </div>
</template>
