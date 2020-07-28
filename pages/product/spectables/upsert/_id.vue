<script>
export default {
    components: {
        TableBuilder: () => import('@/components/tableBuilder/TableBuilder')
    },

    data() {
        return {
            loading: false,
            spec: {}
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
                const data = await this.$api.productSpecTables.get(id);

                if(!data) {
                    throw new Error(this.$t('Spec Table not found'));
                }

                this.spec = data;
            }
            catch(e) {
                this.$errorToast(e.message);
            }

            this.loading = false;
        },


        async onSaveClick() {
            try {
                this.loading = true;
                const p = await this.$api.productSpecTables.upsert(this.spec);

                if(!p) {
                    throw new Error('Error updating spec table');
                }

                const title = p.id ? this.$t('Spec Table updated successfully') : this.$t('Spec Table added successfully');
                this.$successToast(`${title}: ${p.title}`);

                this.$router.push({
                    name: 'product-spectables-list'
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
            v-model="spec.table_data" />

        <div class="ptm">
            <div>{{ $t('Name') }}:</div>
            <div class="pts">
                <b-form-input
                    v-model="spec.name"
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
