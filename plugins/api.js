import MasterTypes from '@/api/master_types';
import Products from '@/api/products';
import ProductSkus from '@/api/product_skus';
import ProductSkuVariantTypes from '@/api/product_sku_variant_types';
import Storage from '@/api/storage';
import Tenants from '@/api/tenants';


export default (context, inject) => {

    // Initialize API repositories
    const repositories = {
        masterTypes: MasterTypes(context.$http),
        products: Products(context.$http),
        productSkus: ProductSkus(context.$http),
        productSkuVariantTypes: ProductSkuVariantTypes(context.$http),
        storage: Storage(context.$http),
        tenants: Tenants(context.$http)
    };

    inject('api', repositories);
};
