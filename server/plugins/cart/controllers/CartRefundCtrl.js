const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
const StripeCtrl = require('./StripeCtrl');
const SqlOperatorBuilder = require('../../core/services/SqlOperatorBuilder.js');
const { config } = require('aws-sdk');

class CartRefundCtrl extends BaseController {

    constructor(server) {
        super(server, 'CartRefund');
        this.CartCtrl = new (require('./CartCtrl'))(server);
        this.StripeCtrl = new StripeCtrl(server);
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


    async refundHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartRefundCtrl.refundHandler', {
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
            const CartRefunds = await this.fetchData(
                {
                    cart_id: request.payload.cart_id,
                    tenant_id: tenantId
                }
            );

            const previousRefundTotal = 0;
            CartRefunds.forEach((CartRefund) => {
                previousRefundTotal += parseInt(CartRefund.get('refund_total'));
            });

            const availableRefund = parseInt(Cart.get('grand_total')) - previousRefundTotal;
            if(refundAmount > availableRefund) {
                global.logger.info(
                    `CartRefundCtrl.refundHandler - the requested refund ${refundAmount} is
                    greater than the remaining available refund for this cart ${availableRefund}`, {
                    meta: {
                        cart: Cart.toJSON()
                    }
                });

                throw new Error('Refund amount is greater than the remaining refund that is available for this cart');
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

            let stripeRefund = null;
            let payPalRefund = null;

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

                stripeRefund = await stripe.refunds.create(stripeArgs);
                console.log("STRIPE REFUND RESPOSNE", stripeRefund)
            }
            else {
                // TODO
            }

            // Create a CartRefund
            const CartRefund = await this.getModel().create({
                tenant_id: tenantId,
                subtotal_refund: request.payload.subtotal_refund,
                shipping_refund: request.payload.shipping_refund,
                tax_refund: request.payload.tax_refund,
                reason: request.payload.reason,
                description: request.payload.description,
                stripe_refund_id: stripeRefund ? stripeRefund.id : null,
                paypal_refund_id: payPalRefund ? payPalRefund.id : null, // TODO: is this right?
                cart_id: request.payload.cart_id
            });

            global.logger.info('RESPONSE: CartItemCtrl.refundHandler', {
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




}

module.exports = CartRefundCtrl;
