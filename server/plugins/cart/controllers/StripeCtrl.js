class StripeCtrl {

    constructor(server) {
        this.server = server;
        this.stripe = null;
    }


    async getStripe(tenantId) {
        if(this.stripe) {
            return this.stripe;
        }

        const Tenant = await this.server.app.bookshelf
            .model('Tenant')
            .query((qb) => {
                qb.where('id', '=', tenantId);
            })
            .fetch();

        const stripeKey = Tenant.get('stripe_key')

        if(!stripeKey) {
            throw new Error('Unable to obtain stripe key from Tenant');
        }

        this.stripe = require('stripe')(
            stripeKey,
            {
                apiVersion: '2012-03-25; orders_beta=v3'
            }
        );

        return this.stripe;
    }

}


module.exports = StripeCtrl;
