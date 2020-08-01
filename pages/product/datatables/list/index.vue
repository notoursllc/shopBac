<script>
export default {
    components: {
        AppTable: () => import('@/components/AppTable'),
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        Fab: () => import('@/components/Fab')
    },

    data() {
        return {
            dataTables: [],
            tableData: {
                headers: [
                    { key: 'name', label: this.$t('Name'), sortable: true },
                    { key: 'updated_at', label: this.$t('Updated'), sortable: true }
                ]
            }
        };
    },

    created() {
        this.fetchData();
    },

    methods: {
         // will need to add pagination params in the future
        async fetchData(paramsObj) {
            try {
                this.dataTables = await this.$api.productDataTables.list(paramsObj);
            }
            catch(err) {
                this.$errorToast(err.message);
            }
        },

        sortChanged(val) {
            this.fetchData(val);
        },

        async onDeleteClick(data) {
            try {
                const confirmed = await this.$confirmModal(
                    this.$t('delete_name?', {'name': data.name}),
                    'warning'
                );

                if(!confirmed) {
                    return;
                }

                const result = await this.$api.productDataTables.delete(data.id);

                if(!result) {
                    throw new Error(this.$t('Data Table not found'));
                }

                this.fetchData();
                this.$successToast(
                    this.$t('deleted_name', { name: data.name })
                );
            }
            catch(err) {
                this.$errorToast(err.message);
            }
        },

        onUpsertClick(data) {
            const params = data ? { id: data.id } : null;

            this.$router.push({
                name: 'product-datatables-upsert-id',
                params
            });
        }
    }
};
</script>


<template>
    <div>
        <fab icon="plus" @click="onUpsertClick" />

        <app-table
            :items="dataTables"
            :fields="tableData.headers"
            @column-sort="sortChanged">

            <!-- name -->
            <template v-slot:cell(name)="row">
                {{ row.item.name }}
                <operations-dropdown
                    :show-view="false"
                    @edit="onUpsertClick(row.item)"
                    @delete="onDeleteClick(row.item)"
                    class="mls" />
            </template>

            <!-- updated -->
            <template v-slot:cell(updated_at)="row">
                {{ row.item.updated_at | format8601 }}
            </template>

        </app-table>
    </div>
</template>
