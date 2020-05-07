<script>

export default {
    components: {
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        Fab: () => import('@/components/Fab')
    },

    data() {
        return {
            dialog: {
                show: false,
                skuOptionId: null
            },
            skuOptions: [],
            sortData: {
                orderBy: 'updated_at',
                orderDir: 'DESC'
            }
        };
    },

    created() {
        this.fetchSkuOptions();
    },

    methods: {
        async fetchSkuOptions() {
            try {
                const { data } = await this.$api.productSkuOptions.list(this.sortData);
                this.skuOptions = data;
                console.log("this.skuOptions", this.skuOptions)
            }
            catch(e) {
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
            }
        },

        sortChanged(val) {
            this.sortData.orderBy = val.prop || 'updated_at';
            this.sortData.orderDir = val.order === 'ascending' ? 'ASC' : 'DESC';
            this.fetchSkuOptions();
        },

        async deleteType(data) {
            try {
                await this.$confirm(
                    this.$t('remove_sku_option_label', {label: data.label}),
                    this.$t('Please confirm'),
                    {
                        confirmButtonText: 'OK',
                        cancelButtonText: 'Cancel',
                        type: 'warning'
                    }
                );

                try {
                    const skuOptionJson = await this.this.$api.productSkuOptions.delete(data.id);

                    if(!skuOptionJson) {
                        throw new Error(this.$t('SKU option not found'));
                    }

                    this.fetchSkuOptions();
                    this.$successMessage(this.$t('sku_option_deleted_label', {label: data.label}));
                }
                catch(e) {
                    this.$errorMessage(
                        e.message,
                        { closeOthers: true }
                    );
                }
            }
            catch(err) {
                // Do nothing
            }
        },

        onUpsertClick(id) {
            this.dialog.skuOptionId = id || null;
            this.dialog.show = true;
        },

        onUpsertSuccess() {
            this.dialog.show = false;
            this.fetchSkuOptions();
        }
    }
};
</script>


<template>
    <div>
        <fab type="add" @click="onUpsertClick" />

        <el-table
            :data="skuOptions"
            class="widthAll"
            @sort-change="sortChanged">

            <el-table-column type="expand">
                <template slot-scope="scope">
                    <pre style="overflow-x:scroll">{{ scope.row | formatJson }}</pre>
                </template>
            </el-table-column>

            <!-- label -->
            <el-table-column
                prop="label"
                label="Label"
                sortable="custom">
                <template slot-scope="scope">
                    {{ scope.row.label }}
                    <operations-dropdown
                        :show-view="false"
                        @edit="onUpsertClick(scope.row.id)"
                        @delete="deleteType(scope.row)" />
                </template>
            </el-table-column>

            <!-- length -->
            <el-table-column
                prop="description"
                :label="$t('Description')"
                sortable="custom">
            </el-table-column>
        </el-table>

        <el-dialog
            :visible.sync="dialog.show"
            :destroy-on-close="true"
            width="95%"
            top="5vh">
            TODO
            <!-- <shipping-package-type-upsert-form
                :id="dialog.skuOptionId"
                @success="onUpsertSuccess"
                @cancel="dialog.show = false" /> -->
        </el-dialog>

    </div>
</template>
