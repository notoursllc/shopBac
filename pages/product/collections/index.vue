<script>
export default {
    components: {
        AppTable: () => import('@/components/AppTable'),
        Fab: () => import('@/components/Fab'),
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        BooleanTag: () => import('@/components/BooleanTag')
    },

    data() {
        return {
            collections: [],
            tableData: {
                headers: [
                    { key: 'name', label: this.$t('Name'), sortable: true },
                    { key: 'published', label: this.$t('Published'), sortable: true }
                ]
            }
        };
    },

    created() {
        this.fetchCollections();
    },

    methods: {
        async fetchCollections(paramsObj) {
            try {
                this.collections = await this.$api.productCollections.list(paramsObj);
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        sortChanged(val) {
            this.fetchCollections(val);
        },

        async onDeleteCollection(data) {
            const confirmed = await this.$confirmModal(
                this.$t('delete_name?', {'name': data.name}),
                'warning'
            );

            if(!confirmed) {
                return;
            }

            try {
                const collection = await this.$api.productCollections.delete(data.id);

                if(!collection) {
                    throw new Error(this.$t('Collection not found'));
                }

                this.fetchCollections();
                this.$successToast(this.$t('deleted_name', {'name': data.name}));
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        goToCollectionUpsert(id) {
            this.$router.push({
                name: 'product-collections-upsert',
                params: { id }
            });
        }
    }
};
</script>


<template>
    <div>
        <fab icon="plus" @click="goToCollectionUpsert" />

        <app-table
            :items="collections"
            :fields="tableData.headers"
            @column-sort="sortChanged">

            <!-- title -->
            <template v-slot:cell(name)="row">
                {{ row.item.name }}
                <operations-dropdown
                    :show-view="false"
                    @edit="goToCollectionUpsert(row.item.id)"
                    @delete="onDeleteCollection(row.item)"
                    class="mls" />
            </template>

            <!-- published -->
            <template v-slot:cell(published)="row">
                <boolean-tag :value="row.item.published" />
            </template>
        </app-table>
    </div>
</template>
