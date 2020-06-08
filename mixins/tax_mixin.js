export default {
    methods: {
        taxmix_goToList() {
            this.$router.push({
                name: 'tax-list'
            });
        },

        taxmix_goToUpsert(id) {
            this.$router.push({
                name: 'tax-upsert-id',
                params: { id }
            });
        }
    }
};
