const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const isFinite = require('lodash.isfinite');
const isObject = require('lodash.isobject');
const BaseController = require('../../core/controllers/BaseController');
const StripeCtrl = require('./StripeCtrl');

const SKU_MAX_QTY_EXCEEDED = 'SKU_MAX_QTY_EXCEEDED';

class CartItemCtrl extends BaseController {

    constructor(server) {
        super(server, 'CartItem');
        this.CartCtrl = new (require('./CartCtrl'))(server);
        this.ProductCtrl = new (require('../../products/controllers/ProductCtrl'))(server);
        this.ProductVariantCtrl = new (require('../../products/controllers/ProductVariantCtrl'))(server);
        this.ProductVariantSkuCtrl = new (require('../../products/controllers/ProductVariantSkuCtrl'))(server);
        this.StripeCtrl = new StripeCtrl(server);
    }


    getSchema(isUpdate) {
        const schema = {
            tenant_id: Joi.string().uuid(),

            qty: Joi.alternatives().try(
                Joi.number().integer().min(0)
            ),

            cart_id: Joi.alternatives().try(Joi.string().uuid(), Joi.allow(null)),
            product_variant_sku_id: Joi.string().uuid().required(),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date()
        };

        if(isUpdate) {
            schema.id = Joi.string().uuid().required();
        }

        return schema;
    }


    async createOrUpdate(data) {
        // First, try to fetch a CartItem for this cart & SKU
        const CartItem = await this.modelForgeFetch({
            cart_id: data.cart_id,
            product_variant_sku_id: data.product_variant_sku_id,
            tenant_id: data.tenant_id
        });

        const quantity = parseInt(data.qty);

        const upsertArgs = Object.assign(
            {},
            data,
            {
                id: CartItem ? CartItem.get('id') : null,
                qty: CartItem ? parseInt(CartItem.get('qty') + quantity) : quantity
            }
        )

        return this.upsertModel(upsertArgs);
    }


    async dedupeCart(cartId, tenantId) {
        try {
            const Cart = await this.CartCtrl.getActiveCart(
                cartId,
                tenantId,
                { withRelated: ['cart_items', 'cart_items.product_variant_sku'] }
            );

            const cartItems = Cart.related('cart_items');
            const cartItemsBySku = {};
            const promises = [];

            // TODO: add a transaction here?
            cartItems.forEach((cItem, index) => {
                const cartItemSku = cItem.related('product_variant_sku');
                const skuId = cartItemSku.get('id');

                // If this cItem has a duplicate sku (size)
                // then update the already existing sku by incrementing it's qty with this dupe's qty
                // and delete this cItem
                if(!cartItemsBySku.hasOwnProperty(skuId)) {
                    cartItemsBySku[skuId] = cItem;
                }
                else {
                    // A cart item exists in the sku lookup table, so it's a dupe.
                    // That means we need to add this 'dupe' cItem qty
                    // to the qty of the cart item in the sku lookup table,
                    // then delete (destroy) the dupe
                    const CartItemFromLookup = cartItemsBySku[skuId];
                    const quantity_sum = parseInt(CartItemFromLookup.get('qty'), 10) + parseInt(cItem.get('qty'), 10);

                    cartItemsBySku[skuId].set({
                        qty: quantity_sum
                    });

                    promises.push(
                        cartItemsBySku[skuId].save(),
                        cItem.destroy()
                    );
                }
            });

            await Promise.all(promises)
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async reduceRequestedCartItemQtyIfExceededProductLimit(tenantId, cartId, cartItemId, requestedCartItemQty) {
        const [ Cart, CartItem ] = await Promise.all([
            this.CartCtrl.getOrCreateCart(
                cartId,
                tenantId,
                { withRelated: ['cart_items', 'cart_items.product'] }
            ),
            this.modelForgeFetch(
                {
                    id: cartItemId,
                    tenant_id: tenantId
                },
                { withRelated: ['product'] }
            )
        ]);

        if(!Cart) {
            throw new Error('Cart does not exist');
        }
        if(!CartItem) {
            throw new Error('CartItem does not exist');
        }

        const cart_items = Cart.related('cart_items');
        const lookup = {};

        cart_items.forEach((cItem) => {
            const productId = cItem.related('product').get('id');

            if(!lookup.hasOwnProperty(productId)) {
                lookup[productId] = 0;
            }

            // add the 'new' quantity if the id from the request mathces the cItem id
            if(cItem.get('id') === cartItemId) {
                lookup[productId] += parseInt(requestedCartItemQty, 10);
            }
            else {
                lookup[productId] += parseInt(cItem.get('qty'), 10);
            }
        });

        // if the lookup prod is over the max then that will tell us how much
        // we need to trim from the request
        const pid = CartItem.related('product').get('id');
        const exceeded = lookup[pid] - parseInt(process.env.CART_PRODUCT_QUANTITY_LIMIT, 10);
        let requestedQty = parseInt(requestedCartItemQty, 10);

        if(exceeded > 0) {
            requestedQty -= exceeded;
        }

        return requestedQty;
    }


    async createHandler(request, h) {
        try {
            global.logger.info('RESPONSE: CartItemCtrl.createHandler', {
                meta: request.payload
            });

            const tenantId = this.getTenantIdFromAuth(request);

            // Fetch the SKU to make sure it exists
            // and also fetch the Cart
            const [ ProductVariantSku, Cart ] = await Promise.all([
                this.ProductVariantSkuCtrl.modelForgeFetch({
                    id: request.payload.product_variant_sku_id,
                    tenant_id: tenantId
                }),
                this.CartCtrl.getOrCreateCart(
                    request.payload.cart_id,
                    tenantId,
                    { withRelated: ['cart_items', 'cart_items.product'] }
                )
            ]);

            if(!ProductVariantSku) {
                throw new Error('SKU does not exist');
            }
            if(!Cart) {
                throw new Error('Cart does not exist');
            }

            // TODO: Can I request the related product here too
            // so I dont have to fetch it again below?
            const ProductVariant = await this.ProductVariantCtrl.modelForgeFetch({
                id: ProductVariantSku.get('product_variant_id'),
                tenant_id: tenantId
            });

            if(!ProductVariant) {
                throw new Error('ProductVariant does not exist');
            }

            const Product = await this.ProductCtrl.modelForgeFetch({
                id: ProductVariant.get('product_id'),
                tenant_id: tenantId
            });

            if(!Product) {
                throw new Error('Product does not exist');
            }

            // If there are cart items, then check to see if we have reached
            // the max qty for the product we are adding
            const cart_items = Cart.related('cart_items');
            const lookup = {};

            if(cart_items) {
                cart_items.forEach((cItem) => {
                    const productId = cItem.related('product').get('id');

                    if(!lookup.hasOwnProperty(productId)) {
                        lookup[productId] = 0;
                    }
                    lookup[productId] += parseInt(cItem.get('qty'), 10);
                });
            }

            const pid = Product.get('id');

            if(lookup[pid]
                && lookup[pid] + parseInt(request.payload.qty, 10) > parseInt(process.env.CART_PRODUCT_QUANTITY_LIMIT, 10)) {
                throw Boom.badRequest(
                    new Error('INVALID_QUANTITY')
                );
            }

            await this.createOrUpdate({
                tenant_id: tenantId,
                qty: request.payload.qty,
                cart_id: Cart.get('id'),
                product_variant_sku_id: ProductVariantSku.get('id'),
                product_id: Product.get('id'),
                product_variant_id: ProductVariant.get('id'),
            });

            // Clear the selected_shipping_rate value, if requested
            if(request.payload.clear_shipping_rate) {
                await this.CartCtrl.clearShippingRate(
                    Cart.get('id'),
                    tenantId
                )
            }

            const UpdatedCart = await this.CartCtrl.getActiveCart(
                Cart.get('id'),
                tenantId,
                { withRelated: this.CartCtrl.getAllCartRelations() }
            );

            return h.apiSuccess(
                this.CartCtrl.getMaskedCart(UpdatedCart)
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Updates the quantity or the ProductVariantSku of a cart item
     */
     async updateHandler(request, h) {
        global.logger.info(`REQUEST: CartItemCtrl.updateHandler`, {
            meta: request.payload
        });

        try {
            const tenantId = this.getTenantIdFromAuth(request);

            // Fetch the SKU to make sure it exists
            const ProductVariantSku = await this.ProductVariantSkuCtrl.modelForgeFetch({
                id: request.payload.product_variant_sku_id,
                tenant_id: tenantId
            });

            if(!ProductVariantSku) {
                throw new Error('SKU does not exist');
            }

            const requestQty = await this.reduceRequestedCartItemQtyIfExceededProductLimit(
                tenantId,
                request.payload.cart_id,
                request.payload.id,
                request.payload.qty
            );

            await this.getModel().update(
                {
                    qty: requestQty,
                    product_variant_sku_id: request.payload.product_variant_sku_id
                },
                {
                    id: request.payload.id
                }
            )

            await this.dedupeCart(request.payload.cart_id, tenantId);

            // Clear the selected_shipping_rate value, if requested
            if(request.payload.clear_shipping_rate) {
                await this.CartCtrl.clearShippingRate(
                    request.payload.cart_id,
                    tenantId
                )
            }

            // get a fresh cart to return
            const UpdatedCart = await this.CartCtrl.getActiveCart(
                request.payload.cart_id,
                tenantId,
                { withRelated: this.CartCtrl.getAllCartRelations() }
            );

            const updatedCartJson = UpdatedCart.toJSON();

            global.logger.info('RESPONSE: CartItemCtrl.updateHandler', {
                meta: updatedCartJson
            });

            return h.apiSuccess(updatedCartJson);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    /**
     * Deletes a product, including its related skus and images
     *
     * @param {*} request
     * @param {*} h
     */
    async deleteHandler(request, h) {
        try {
            global.logger.info('REQUEST: CartItemCtrl.deleteHandler', {
                meta: request.query
            });

            const cartItemId = request.query.id;
            const tenantId = this.getTenantIdFromAuth(request);

            const CartItem = await this.modelForgeFetch(
                {
                    id: cartItemId,
                    tenant_id: tenantId
                },
                { withRelated: ['product'] }
            );

            if(!CartItem) {
                throw Boom.badRequest('Unable to find CartItem.');
            }

            await this.deleteModel(cartItemId, tenantId);

            // Clear the selected_shipping_rate value, if requested
            if(request.query.clear_shipping_rate) {
                await this.CartCtrl.clearShippingRate(
                    CartItem.get('cart_id'),
                    tenantId
                )
            }

            const UpdatedCart = await this.CartCtrl.getActiveCart(
                CartItem.get('cart_id'),
                tenantId,
                { withRelated: this.CartCtrl.getAllCartRelations() }
            );

            const updatedCartJson = UpdatedCart.toJSON();

            global.logger.info('RESPONSE: CartItemCtrl.deleteHandler', {
                meta: updatedCartJson
            });

            return h.apiSuccess(updatedCartJson);
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }





}


module.exports = CartItemCtrl;
