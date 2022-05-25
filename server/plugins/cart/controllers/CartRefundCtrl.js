const Joi = require('joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
const StripeCtrl = require('./StripeCtrl');
const PayPalCtrl = require('./PayPalCtrl');
const { config } = require('aws-sdk');
const { DB_TABLES } = require('../../core/services/CoreService');
class CartRefundCtrl extends BaseController {

    constructor(server) {
        super(server, 'CartRefund');
        this.CartCtrl = new (require('./CartCtrl'))(server);
        this.StripeCtrl = new StripeCtrl(server);
        this.PayPalCtrl = new PayPalCtrl(server);
    }

    getSchema(isUpdate) {
        const schema = {
            tenant_id: Joi.string().uuid().required(),
            cart_id: Joi.string().uuid().required(),

            subtotal_refund: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.allow(null)
            ),

            shipping_refund: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.allow(null)
            ),

            tax_refund: Joi.alternatives().try(
                Joi.number().integer().min(0),
                Joi.allow(null)
            ),

            description: Joi.alternatives().try(
                Joi.string().trim().max(500),
                Joi.allow(null)
            ),

            reason: Joi.alternatives().try(
                Joi.string().max(50),
                Joi.allow(null)
            ),

            created_at: Joi.date(),
            updated_at: Joi.date()
        };

        if(isUpdate) {
            schema.id = Joi.string().uuid().required();
        }

        return schema;
    }


    async addRefundHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartRefundCtrl.addRefundHandler', {
                meta: request.payload
            });

            const tenantId = this.getTenantIdFromAuth(request);
            const stripe = await this.StripeCtrl.getStripe(tenantId);

            const Cart = await this.CartCtrl.getClosedCart(
                request.payload.cart_id,
                tenantId,
                { withRelated: this.CartCtrl.getAllCartRelations() }
            );

            if(!Cart) {
                throw new Error('Cart not found')
            }

            let refundAmount = 0;
            if(request.payload.subtotal_refund) {
                refundAmount += request.payload.subtotal_refund
            }
            if(request.payload.shipping_refund) {
                refundAmount += request.payload.shipping_refund
            }
            if(request.payload.tax_refund) {
                refundAmount += request.payload.tax_refund
            }

            if(Cart.grand_total < refundAmount) {
                throw new Error('Refund amount must be less than the Cart total')
            }

            // If refunds have previously been given for this Cart,
            // then this new refund must be <= the remainder of the
            // Cart.grand_total - total of previously given refunds
            const refundSummary = await this.getCartRefundSummary(tenantId, request.payload.cart_id);
            const previousRefundTotal = parseInt(refundSummary.total, 10) || 0;
            // console.log("REFUND SUMMARY", refundSummary, previousRefundTotal);

            const availableRefund = parseInt(Cart.get('grand_total')) - previousRefundTotal;
            if(refundAmount > availableRefund) {
                global.logger.info(
                    `CartRefundCtrl.addRefundHandler - the requested refund ${refundAmount} is
                    greater than the remaining available refund for this cart ${availableRefund}`, {
                    meta: {
                        cart: Cart.toJSON()
                    }
                });

                throw new Error('Refund amount is greater than the remaining funds available for this cart.');
            }

            // This shouldn't happen, but checking just in case I guess
            if(!Cart.get('stripe_payment_intent_id') && !Cart.get('paypal_order_id')) {
                global.logger.error(
                    `CartCtrl.getOrderHandler - can not process refund because the Cart did not contain
                    a stripe_payment_intent_id value or a paypal_order_id value`, {
                    meta: {
                        cart: Cart.toJSON()
                    }
                });
                throw new Error('Error processing refund');
            }

            let stripeRefundId = null;
            let payPalRefundId = null;

            // Process the refund via Stripe
            if(Cart.get('stripe_payment_intent_id')) {
                const stripeArgs = {
                    payment_intent: Cart.get('stripe_payment_intent_id'),
                    amount: refundAmount,
                    reason: request.payload.reason,
                }
                if(request.payload.description) {
                    stripeArgs.metadata = {
                        cart: Cart.get('id'),
                        refund_desc: request.payload.description
                    }
                }

                const stripeRefund = await stripe.refunds.create(stripeArgs);
                // console.log("STRIPE REFUND RESPOSNE", stripeRefund)
                stripeRefundId = stripeRefund.id;
            }
            else {
                const refundResponse = await this.PayPalCtrl.refundPayment(
                    Cart.get('paypal_order_id'),
                    tenantId,
                    refundAmount
                );
                // console.log("PAYPAL REFUND RESPOSNE", refundResponse)
                payPalRefundId = refundResponse.result.id
            }

            // Create a CartRefund
            const CartRefund = await this.getModel().create({
                tenant_id: tenantId,
                cart_id: request.payload.cart_id,
                subtotal_refund: request.payload.subtotal_refund,
                shipping_refund: request.payload.shipping_refund,
                tax_refund: request.payload.tax_refund,
                reason: request.payload.reason,
                description: request.payload.description,
                stripe_refund_id: stripeRefundId || null,
                paypal_refund_id: payPalRefundId || null
            });

            global.logger.info('RESPONSE: CartItemCtrl.addRefundHandler', {
                meta: CartRefund.toJSON()
            });

            return h.apiSuccess(CartRefund);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async getCartRefundSummary(tenant_id, cart_id) {
        /*
        * Note: this also could have been written as:
        * .select('cart_id', this.server.app.knex.raw('SUM(total_refund) AS total'))
        */
        const results = await this.server.app.knex
            .select('cart_id')
            .sum({ total: 'total_refund' })
            .from(DB_TABLES.cart_refunds)
            .where('tenant_id', tenant_id)
            .where('cart_id', cart_id)
            .groupBy('cart_id');

        return results[0] || { cart_id: cart_id, total: 0 };
    }


    async getCartRefundSummaryHandler(request, h) {
        try {
            const tenantId = this.getTenantIdFromAuth(request);

            if(!tenantId) {
                throw Boom.unauthorized();
            }

            const results = await this.getCartRefundSummary(
                tenantId,
                request.query.cart_id
            )

            global.logger.info(`RESPONSE: CartRefundCtrl.getCartRefundSummary`, {
                meta: {
                    results
                }
            });

            return h.apiSuccess(
                results
            )
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.notFound(err);
        }
    }
}

module.exports = CartRefundCtrl;
