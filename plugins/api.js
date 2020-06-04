import MasterTypes from '@/api/master_types';
import Products from '@/api/products';
import ProductSkus from '@/api/product_skus';
import ProductSkuVariantTypes from '@/api/product_sku_variant_types';
import Storage from '@/api/storage';
import Tenants from '@/api/tenants';


export default (context, inject) => {

    // Initialize API repositories
    const repositories = {
        masterTypes: MasterTypes(context.$axios),
        products: Products(context.$axios),
        productSkus: ProductSkus(context.$axios),
        productSkuVariantTypes: ProductSkuVariantTypes(context.$axios),
        storage: Storage(context.$axios),
        tenants: Tenants(context.$axios)
    };

    inject('api', repositories);
};
