import Cart from '@/api/cart';
import MasterTypes from '@/api/master_types';
import Payments from '@/api/payments';
import Products from '@/api/products';
import ProductSkus from '@/api/product_skus';
import ProductSkuVariantTypes from '@/api/product_sku_variant_types';
import Shipping from '@/api/shipping';
import Storage from '@/api/storage';
import Tenants from '@/api/tenants';
import Taxes from '@/api/taxes';


export default (context, inject) => {

    // Initialize API repositories
    const repositories = {
        cart: Cart(context.$http),
        masterTypes: MasterTypes(context.$http),
        payments: Payments(context.$http),
        products: Products(context.$http),
        productSkus: ProductSkus(context.$http),
        productSkuVariantTypes: ProductSkuVariantTypes(context.$http),
        shipping: Shipping(context.$http),
        storage: Storage(context.$http),
        tenants: Tenants(context.$http),
        taxes: Taxes(context.$http)
    };

    inject('api', repositories);

};
