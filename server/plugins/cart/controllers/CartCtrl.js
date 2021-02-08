const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');
const uuidV4 = require('uuid/v4');
const { ObtainTokenRequest } = require('square-connect');

function getJoiStringOrNull(strLen) {
    return Joi.alternatives().try(Joi.string().trim().max(strLen || 100), Joi.allow(null));
}
class CartCtrl extends BaseController {

    constructor(server) {
        super(server, 'Cart');
        this.CartItemCtrl = new (require('./CartItemCtrl'))(server);
        this.ProductCtrl = new (require('../../products/controllers/ProductCtrl'))(server);
        this.ProductVariantCtrl = new (require('../../products/controllers/ProductVariantCtrl'))(server);
        this.ProductVariantSkuCtrl = new (require('../../products/controllers/ProductVariantSkuCtrl'))(server);
    }


    getSchema() {
        return {
            // id: Joi.string().uuid().allow(null),
            tenant_id: Joi.string().uuid(),

            billing_firstName: getJoiStringOrNull(),
            billing_lastName: getJoiStringOrNull(),
            billing_company: getJoiStringOrNull(),
            billing_streetAddress: getJoiStringOrNull(),
            billing_extendedAddress: getJoiStringOrNull(),
            billing_city: getJoiStringOrNull(),
            billing_state: getJoiStringOrNull(),
            billing_postalCode: getJoiStringOrNull(),
            billing_countryCodeAlpha2: getJoiStringOrNull(2),
            billing_phone: getJoiStringOrNull(),

            shipping_firstName: getJoiStringOrNull(),
            shipping_lastName: getJoiStringOrNull(),
            shipping_company: getJoiStringOrNull(),
            shipping_streetAddress: getJoiStringOrNull(),
            shipping_extendedAddress: getJoiStringOrNull(),
            shipping_city: getJoiStringOrNull(),
            shipping_state: getJoiStringOrNull(),
            shipping_postalCode: getJoiStringOrNull(),
            shipping_countryCodeAlpha2: getJoiStringOrNull(2),
            shipping_email: Joi.alternatives().try(Joi.string().email().max(50).label('Shipping: Email'), Joi.allow(null)),

            sales_tax: Joi.alternatives().try(Joi.number().integer().min(0), Joi.allow(null)),

            created_at: Joi.date(),
            updated_at: Joi.date(),
            deleted_at: Joi.date(),
            closed_at: Joi.date()
        };
    }


    getAddItemSchema() {
        return {
            tenant_id: Joi.string().uuid(),
            cart: Joi.alternatives().try(Joi.string().uuid(), Joi.allow(null)),
            product_variant_sku: Joi.string().uuid().required(),
            qty: Joi.number().integer().min(0)
        };
    }



    // async createHandler(request, h) {
    //     try {
    //         global.logger.info(`REQUEST: CartCtrl.createHandler (${this.modelName})`);

    //         request.payload.token = uuidV4();

    //         const ShoppingCart = await this.getModel().create(request.payload);

    //         global.logger.info(`RESPONSE: CartCtrl.createHandler (${this.modelName})`, {
    //             meta: {
    //                 model: ShoppingCart ? ShoppingCart.toJSON() : null
    //             }
    //         });

    //         return h.apiSuccess(ShoppingCart);
    //     }
    //     catch(err) {
    //         global.logger.error(err);
    //         global.bugsnag(err);
    //         throw Boom.badRequest(err);
    //     }
    // }

    // async createModel(request, h) {
    //     try {
    //         global.logger.info(`REQUEST: CartCtrl.createHandler (${this.modelName})`);

    //         request.payload.token = uuidV4();

    //         const ShoppingCart = await this.getModel().create(request.payload);

    //         global.logger.info(`RESPONSE: CartCtrl.createHandler (${this.modelName})`, {
    //             meta: {
    //                 model: ShoppingCart ? ShoppingCart.toJSON() : null
    //             }
    //         });

    //         return h.apiSuccess(ShoppingCart);
    //     }
    //     catch(err) {
    //         global.logger.error(err);
    //         global.bugsnag(err);
    //         throw Boom.badRequest(err);
    //     }
    // }


    /**
     * This is just a helper function to determine if the cart token being sent
     * is for an active cart.
     * Used by functions below to determine if we should continue with other operations,
     * or just quit immediately.
     */
    async getActiveCart(id, tenant_id) {
        if(!id || !tenant_id) {
            return false;
        }

        const Cart = await this.modelForgeFetch(
            { id, tenant_id },
        );

        if(!Cart || Cart.get('closed_at')) {
            return false;
        }

        return Cart;
    }


    async getOrCreateCart(id, tenant_id) {
        const Cart = await this.getActiveCart(id, tenant_id);

        if(!Cart) {
            // create
            return this.upsertModel({
                tenant_id
            });
        }

        return Cart;
    }


    async addItemHandler(request, h) {
        try {
            const tenantId = this.getTenantIdFromAuth(request);

            // Fetch the SKU to make sure it exists
            // and also fetch the Cart
            const [ ProductVariantSku, Cart ] = await Promise.all([
                this.ProductVariantSkuCtrl.modelForgeFetch({
                    id: request.payload.product_variant_sku,
                    tenant_id: tenantId
                }),
                this.getOrCreateCart(
                    request.payload.cart,
                    tenantId
                )
            ]);

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

            await this.CartItemCtrl.createOrUpdate({
                tenant_id: tenantId,
                qty: request.payload.qty,
                cart_id: cartId,
                product_variant_sku_id: productVariantSkuId,
                product_id: Product.get('id'),
                product_variant_id: ProductVariant.get('id'),
            });

            // get an updated Cart to return
            const UpdatedCart = await this.modelForgeFetch(
                { id: cartId, tenant_id: tenantId },
                { withRelated: ['cart_items', 'cart_items.product', 'cart_items.product_variant', 'cart_items.product_variant_sku'] }
            );

            // TODO: use the mask plugin here to hide the unneeded product and product_variant props
            // before returning
            // https://github.com/seegno/bookshelf-mask




            return h.apiSuccess(
                // mask plugin:
                // https://github.com/seegno/bookshelf-mask
                UpdatedCart.mask(`*,cart_items(id,qty,product(id,title,description),product_variant(currency,display_price,is_on_sale,images,swatches),product_variant_sku(id,label,display_price,sku))`)
                // UpdatedCart.mask(`
                //     id,
                //     billing_firstName,
                //     billing_lastName,
                //     billing_company,
                //     billing_streetAddress,
                //     billing_extendedAddress,
                // `)
                // UpdatedCart.mask('cart_items(product(id,title))')
            );
        }
        catch(err) {
            global.logger.error(err);
            global.bugsnag(err);
            throw Boom.badRequest(err);
        }
    }


    async upsertHandler(request, h) {
        // Creating the token manually for new carts
        // if(!request.payload.id) {
        //     request.payload.token = uuidV4();
        // }

        return super.upsertHandler(request, h)
    }

}


module.exports = CartCtrl;
