<script>
export default {
    components: {
        AppTable: () => import('@/components/AppTable'),
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        SkuVariantTypeForm: () => import('@/components/product/sku/SkuVariantTypeForm'),
        Fab: () => import('@/components/Fab')
    },

    data() {
        return {
            dialog: {
                id: null
            },
            types: [],
            tableData: {
                headers: [
                    { key: 'label', label: this.$t('Label'), sortable: true },
                    { key: 'description', label: this.$t('Description'), sortable: true }
                ]
            }
        };
    },

    created() {
        this.fetchTypes();
    },

    methods: {
        async fetchTypes(paramsObj) {
            try {
                const { data } = await this.$api.productSkuVariantTypes.list(paramsObj);
                this.types = data;
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        sortChanged(val) {
            this.fetchTypes(val);
        },

        async deleteType(data) {
            const confirmed = await this.$confirmModal(
                this.$t('remove_label?', {label: data.label}),
                'warning'
            );

            if(!confirmed) {
                return;
            }

            try {
                const typeJson = await this.$api.productSkuVariantTypes.delete(data.id);

                if(!typeJson) {
                    throw new Error(this.$t('Item not found'));
                }

                this.fetchTypes();
                this.$successToast(this.$t('item_deleted_label', {label: data.label}));
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        onUpsertClick(id) {
            this.dialog.id = id || null;
            this.$refs.upsert_modal.show();
        },

        onUpsertSuccess() {
            this.$refs.upsert_modal.hide();
            this.fetchTypes();
        }
    }
};
</script>


<template>
    <div>
        <fab icon="plus" @click="onUpsertClick" />

        <app-table
            :items="types"
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

            <!-- description -->
            <template v-slot:cell(description)="row">
                {{ row.item.description }}
            </template>
        </app-table>

        <b-modal
            ref="upsert_modal"
            size="lg"
            :title="dialog.id ? $t('Edit custom SKU attribute') : $t('Add custom SKU attribute')"
            hide-footer>
            <sku-variant-type-form
                :id="dialog.id"
                @success="onUpsertSuccess" />
        </b-modal>
    </div>
</template>
