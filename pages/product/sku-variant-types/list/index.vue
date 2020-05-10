<script>

export default {
    components: {
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        SkuVariantTypeForm: () => import('@/components/product/sku/SkuVariantTypeForm'),
        Fab: () => import('@/components/Fab')
    },

    data() {
        return {
            dialog: {
                show: false,
                id: null
            },
            types: [],
            sortData: {
                orderBy: 'updated_at',
                orderDir: 'DESC'
            }
        };
    },

    created() {
        this.fetchTypes();
    },

    methods: {
        async fetchTypes() {
            try {
                const { data } = await this.$api.productSkuVariantTypes.list(this.sortData);
                this.types = data;
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
            this.fetchTypes();
        },

        async deleteType(data) {
            try {
                await this.$confirm(
                    this.$t('remove_label?', {label: data.label}),
                    this.$t('Please confirm'),
                    {
                        confirmButtonText: 'OK',
                        cancelButtonText: 'Cancel',
                        type: 'warning'
                    }
                );

                try {
                    const typeJson = await this.$api.productSkuVariantTypes.delete(data.id);

                    if(!typeJson) {
                        throw new Error(this.$t('Item not found'));
                    }

                    this.fetchTypes();
                    this.$successMessage(this.$t('item_deleted_label', {label: data.label}));
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
            this.dialog.id = id || null;
            this.dialog.show = true;
        },

        onUpsertSuccess() {
            this.dialog.show = false;
            this.fetchTypes();
        }
    }
};
</script>


<template>
    <div>
        <fab type="add" @click="onUpsertClick" />

        <el-table
            :data="types"
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

            <!-- description -->
            <el-table-column
                prop="description"
                :label="$t('Description')">
            </el-table-column>
        </el-table>

        <el-dialog
            :visible.sync="dialog.show"
            :destroy-on-close="true"
            width="600px"
            top="5vh">
            <sku-variant-type-form
                :id="dialog.id"
                @success="onUpsertSuccess" />
        </el-dialog>

    </div>
</template>
