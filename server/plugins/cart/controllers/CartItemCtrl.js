const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const isFinite = require('lodash.isfinite');
const BaseController = require('../../core/controllers/BaseController');

const SKU_MAX_QTY_EXCEEDED = 'SKU_MAX_QTY_EXCEEDED';

class CartItemCtrl extends BaseController {

    constructor(server) {
        super(server, 'CartItem');
        this.CartCtrl = new (require('./CartCtrl'))(server);
        this.ProductCtrl = new (require('../../products/controllers/ProductCtrl'))(server);
        this.ProductVariantCtrl = new (require('../../products/controllers/ProductVariantCtrl'))(server);
        this.ProductVariantSkuCtrl = new (require('../../products/controllers/ProductVariantSkuCtrl'))(server);
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


    getActiveCart(cartId, tenantId) {
        return this.CartCtrl.getActiveCart(
            cartId,
            tenantId,
            {
                withRelated: {
                    'cart_items': (query) => {
                        query.orderBy('created_at', 'ASC');
                    },
                    'cart_items.product': null,
                    'cart_items.product_variant': null,
                    'cart_items.product_variant_sku': null
                }
            }
        );
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


    async createHandler(request, h) {
        try {
            const tenantId = this.getTenantIdFromAuth(request);

            console.log("createHandler", request.payload)

            // Fetch the SKU to make sure it exists
            // and also fetch the Cart
            const [ ProductVariantSku, Cart ] = await Promise.all([
                this.ProductVariantSkuCtrl.modelForgeFetch({
                    id: request.payload.product_variant_sku_id,
                    tenant_id: tenantId
                }),
                this.CartCtrl.getOrCreateCart(
                    request.payload.cart_id,
                    tenantId
                )
            ]);

            console.log("CART", Cart)

            // Throw an error if this SKU does not exist
            if(!ProductVariantSku) {
                throw new Error('SKU does not exist');
            }

            // Get the ProductVariant
            const ProductVariant = await this.ProductVariantCtrl.modelForgeFetch({
                id: ProductVariantSku.get('product_variant_id'),
                tenant_id: tenantId
            });

            if(!ProductVariant) {
                throw new Error('ProductVariant does not exist');
            }

            // Get the product
            const Product = await this.ProductCtrl.modelForgeFetch({
                id: ProductVariant.get('product_id'),
                tenant_id: tenantId
            });

            if(!Product) {
                throw new Error('Product does not exist');
            }

            const cartId = Cart.get('id');
            const productVariantSkuId = ProductVariantSku.get('id');

            await this.createOrUpdate({
                tenant_id: tenantId,
                qty: request.payload.qty,
                cart_id: cartId,
                product_variant_sku_id: productVariantSkuId,
                product_id: Product.get('id'),
                product_variant_id: ProductVariant.get('id'),
            });

            // get an updated Cart to return
            const UpdatedCart = await this.getActiveCart(cartId, tenantId);

            // TODO: use the mask plugin here to hide the unneeded product and product_variant props
            // before returning
            // https://github.com/seegno/bookshelf-mask

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
            // Also fetch the Cart just to make sure it exists and is still open
            const [ ProductVariantSku, Cart, CartItem ] = await Promise.all([
                this.ProductVariantSkuCtrl.modelForgeFetch({
                    id: request.payload.product_variant_sku_id,
                    tenant_id: tenantId
                }),
                this.CartCtrl.getActiveCart(
                    request.payload.cart_id,
                    tenantId,
                    { withRelated: ['cart_items', 'cart_items.product'] }
                ),
                this.modelForgeFetch(
                    {
                        id: request.payload.id,
                        tenant_id: tenantId
                    },
                    { withRelated: ['product'] }
                )
            ]);

            if(!ProductVariantSku) {
                throw new Error('SKU does not exist');
            }
            if(!Cart) {
                throw new Error('Cart does not exist');
            }
            if(!CartItem) {
                throw new Error('CartItem does not exist');
            }


            // For the purpose of checking the total quantity of each product,
            // putting the cart items into a lookup table
            const cart_items = Cart.related('cart_items');
            const lookup = {};

            cart_items.forEach((cItem) => {
                const product = cItem.related('product');
                const productId = product.get('id');

                if(!lookup.hasOwnProperty(productId)) {
                    lookup[productId] = 0;
                }

                // add the 'new' quantity if the id from the request mathces the cItem id
                if(cItem.get('id') === request.payload.id) {
                    lookup[productId] += parseInt(request.payload.qty, 10);
                }
                else {
                    lookup[productId] += parseInt(cItem.get('qty'), 10);
                }
            });

            // if the lookup prod is over the max then that will tell us how much
            // we need to trim from the request
            const pid = CartItem.related('product').get('id');
            const exceeded = lookup[pid] - parseInt(process.env.CART_MAX_PRODUCT_INSTANCES, 10);
            let requestQty = parseInt(request.payload.qty, 10);

            if(exceeded > 0) {
                requestQty -= exceeded;
            }

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

            // get a fresh cart to return
            const UpdatedCart = await this.getActiveCart(request.payload.cart_id, tenantId);
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

}


module.exports = CartItemCtrl;
