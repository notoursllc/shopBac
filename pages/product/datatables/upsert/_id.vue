<script>
export default {
    components: {
        TableBuilder: () => import('@/components/tableBuilder/TableBuilder')
    },

    data() {
        return {
            loading: false,
            data: {}
        };
    },

    mounted() {
        if(this.$route.params.id) {
            this.fetchData();
        }
    },

    methods: {
        async fetchData() {
            const id = this.$route.params.id;
            this.loading = true;

            try {
                const data = await this.$api.productDataTables.get(id);

                if(!data) {
                    throw new Error(this.$t('Data Table not found'));
                }

                this.data = data;
            }
            catch(e) {
                this.$errorToast(e.message);
            }

            this.loading = false;
        },


        async onSaveClick() {
            try {
                this.loading = true;
                const p = await this.$api.productDataTables.upsert(this.data);

                if(!p) {
                    throw new Error('Error updating Data Table');
                }

                const title = p.id ? this.$t('Data Table updated successfully') : this.$t('Data Table added successfully');
                this.$successToast(`${title}: ${p.title}`);

                this.$router.push({
                    name: 'product-datatables-list'
                });
            }
            catch(e) {
                this.$errorToast(e.message);
            }

            this.loading = false;
        }
    }
};
</script>


<template>
    <div v-loading="loading">

        <table-builder
            v-model="data.table_data" />

        <div class="ptm">
            <div>{{ $t('Name') }}:</div>
            <div class="pts">
                <b-form-input
                    v-model="data.name"
                    class="width200" />
            </div>
        </div>

        <div class="mtl">
            <b-button
                variant="primary"
                @click="onSaveClick">{{ $t('Save') }}</b-button>
        </div>

    </div>
</template>


<style lang="scss">
// @import "~assets/css/components/_table.scss";
@import "~assets/css/components/_formRow.scss";
</style>
