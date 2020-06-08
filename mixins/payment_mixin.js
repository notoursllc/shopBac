export default {
    methods: {
        goToPaymentDetails: function(transactionId) {
            return this.$router.push({
                name: 'order-details-id',
                params: { id: transactionId }
            });
        },

        goToPaymentSuccess: function(transactionId) {
            return this.$router.push({
                name: 'order-id',
                params: { id: transactionId }
            });
        }
    }
};
