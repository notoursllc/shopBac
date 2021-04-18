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
    async getActiveCart(id, tenant_id, fetchOptions) {
        if(!id || !tenant_id) {
            return false;
        }

        const Cart = await this.modelForgeFetch(
            { id, tenant_id },
            fetchOptions
        );

        if(!Cart || Cart.get('closed_at')) {
            return false;
        }

        return Cart;
    }


    async getOrCreateCart(id, tenant_id, fetchOptions) {
        const Cart = await this.getActiveCart(id, tenant_id, fetchOptions);

        if(!Cart) {
            // create
            return this.upsertModel({
                tenant_id
            });
        }

        return Cart;
    }


    getMaskedCart(Cart) {
        // mask plugin:
        // https://github.com/seegno/bookshelf-mask
        return Cart.mask(`*,cart_items(id,qty,product(id,title,description),product_variant(id,currency,display_price,base_price,is_on_sale,sale_price,images,label,swatches),product_variant_sku(id,label,display_price,base_price,is_on_sale,sale_price,sku))`)
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
