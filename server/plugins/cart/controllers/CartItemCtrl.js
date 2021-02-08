const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const BaseController = require('../../core/controllers/BaseController');


class CartItemCtrl extends BaseController {

    constructor(server) {
        super(server, 'CartItem');
    }


    getSchema(isUpdate) {
        const schema = {
            tenant_id: Joi.string().uuid(),

            qty: Joi.alternatives().try(
                Joi.number().integer().min(0)
            ),

            cart_id: Joi.string().uuid(),
            sku_id: Joi.string().uuid(),

            // TIMESTAMPS
            created_at: Joi.date(),
            updated_at: Joi.date()
        };

        if(isUpdate) {
            schema.id = Joi.string().uuid().required();
        }

        return schema;
    }


    // async createOrUpdate(request, cart_id, sku_id, qty, otherProps) {
    async createOrUpdate(data) {

        // First, try to fetch a CartItem for this cart & SKU
        const CartItem = await this.modelForgeFetch({
            cart_id: data.cart_id,
            sku_id: data.sku_id,
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

}


module.exports = CartItemCtrl;
