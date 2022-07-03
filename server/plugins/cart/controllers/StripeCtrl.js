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


    // Note:
    // Products can not be deleted if it has a Price attached to it (which ours do)
    // so instead we mark it as active=false
    async archiveProduct(tenant_id, stripe_product_id) {
        global.logger.info('StripeCtrl.archiveProduct', {
            meta: {
                tenant_id,
                stripe_product_id
            }
        });

        const stripe = await this.getStripe(tenant_id);
        return stripe.products.update(
            stripe_product_id,
            { active: false }
        )
    }


    async createPrice(tenant_id, data) {
        global.logger.info('StripeCtrl.createPrice', {
            meta: {
                tenant_id,
                ...data
            }
        });

        const stripe = await this.getStripe(tenant_id);
        return stripe.prices.create({
            currency: 'USD',
            tax_behavior: 'exclusive', // https://stripe.com/docs/tax/products-prices-tax-codes-tax-behavior#tax-behavior
            ...data
        });
    }


    // Note:
    // Prices can not be deleted in Stripe.
    // Instead, they should be marked as active=false
    // Good explanation about this here:
    // https://github.com/stripe/stripe-python/issues/658
    async archivePrice(tenant_id, stripe_price_id) {
        global.logger.info('StripeCtrl.archivePrice', {
            meta: {
                tenant_id,
                stripe_price_id
            }
        });

        const stripe = await this.getStripe(tenant_id);
        return stripe.prices.update(
            stripe_price_id,
            { active: false }
        );
    }

}


module.exports = StripeCtrl;
