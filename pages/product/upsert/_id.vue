<script>
import cloneDeep from 'lodash.clonedeep';
import product_mixin from '@/mixins/product_mixin';
import shipping_mixin from '@/mixins/shipping_mixin';
import notifications_mixin from '@/mixins/notifications_mixin';

export default {
    components: {
        MasterTypeSelect: () => import('@/components/MasterTypeSelect'),
        IconNewWindow: () => import('@/components/icons/IconNewWindow'),
        IconPlayVideo: () => import('@/components/icons/IconPlayVideo'),
        Fab: () => import('@/components/Fab'),
        TextCard: () => import('@/components/TextCard'),
        InputMoney: () => import('@/components/InputMoney'),
        CountrySelect: () => import('@/components/CountrySelect'),
        MetaDataBuilder: () => import('@/components/MetaDataBuilder'),
        ImageManager: () => import('@/components/product/ImageManager'),
        SeoPreview: () => import('@/components/product/SeoPreview'),
        SkuManager: () => import('@/components/product/SkuManager')
    },

    mixins: [
        product_mixin,
        shipping_mixin,
        notifications_mixin
    ],

    data() {
        return {
            loading: false,
            loadingProductImages: false,
            product: {
                attributes: [],
                skus: [],
                images: []
            },
            productHasMetaData: false,
            domainName: process.env.DOMAIN_NAME,
            imageManagerMaxImages: process.env.IMAGE_MANAGER_MAX_IMAGES || 8,
            imageManagerMaxFeaturedImages: process.env.IMAGE_MANAGER_MAX_FEATURED_IMAGES || 3,
            videoPlayerModal: {
                isActive: false,
                videoId: null,
                player: null
            }
        };
    },

    mounted() {
        try {
            if(this.$route.params.id) {
                this.fetchProduct();
            }
            else {
                // setting some defaults:
                this.product.published = true;
            }
        }
        catch(e) {
            this.errorToast(e.message);
        }
    },

    methods: {
        async fetchProduct() {
            const id = this.$route.params.id;
            this.loading = true;

            try {
                const product = await this.$api.products.get(id, { viewAllRelated: true });

                if(!product) {
                    throw new Error(this.$t('Product not found'));
                }

                this.productHasMetaData = product.metadata ? true : false;

                if(!Array.isArray(product.images)) {
                    product.images = [];
                }

                this.product = product;
            }
            catch(e) {
                this.errorToast(e.message);
            }

            this.loading = false;
        },


        async onDeleteProductImage(id) {
            try {
                this.loadingProductImages = true;
                await this.$api.products.deleteImage(id);
                this.successToast(this.$t('Image deleted successfully'));
            }
            catch(e) {
                this.errorToast(e.message);
            }

            this.loadingProductImages = false;
        },


        async saveSkus(productId) {
            try {
                const product = cloneDeep(this.product);
                const p = await this.$api.products.upsert(product);

                if(!p) {
                    throw new Error('Error updating product');
                }

                await this.saveImages(p.id);
                await this.saveSkus(p.id);

                const title = p.id ? 'Product updated successfully' : 'Product added successfully';
                this.successToast(`${title}: ${p.title}`);
                this.goToProductList();
            }
            catch(e) {
                this.errorToast(e.message);
            }
        },


        async onSaveClick() {
            try {
                this.loading = true;
                const p = await this.$api.products.upsert(this.product);

                if(!p) {
                    throw new Error('Error updating product');
                }

                const title = p.id ? this.$t('Product updated successfully') : this.$t('Product added successfully');
                this.successToast(`${title}: ${p.title}`);
                this.goToProductList();
            }
            catch(e) {
                this.errorToast(e.message);
            }

            this.loading = false;
        },


        goToStore(seoUri) {
            const routeData = this.$router.resolve({
                name: 'p-seouri',
                params: { seouri: seoUri }
            });

            // this opens the page in a new tab
            window.open(routeData.href, '_blank');
        },


        playVideo(url) {
            const id = this.$youtube.getIdFromURL(url);
            if(id) {
                this.videoPlayerModal.videoId = id;
                this.videoPlayerModal.isActive = true;
            }
            else {
                this.videoPlayerModal.isActive = false;
            }
        },


        modalClosed() {
            if(this.videoPlayerModal.player) {
                this.videoPlayerModal.player.stopVideo();
            }
        },


        videoPlaying(player) {
            this.videoPlayerModal.player = player;
        }
    }
};
</script>


<template>
    <div v-loading="loading">
        <div class="tar mbm" v-if="product.id">
            <b-button
                variant="outline-secondary"
                @click="goToStore(product.seo_uri)">
                <icon-new-window />&nbsp;{{ $t('View product in store') }}</b-button>
        </div>

        <!-- published-->
        <div class="mbl">
            <b-form-checkbox
                v-model="product.published">{{ $t('This product is available for purchase') }}</b-form-checkbox>
        </div>


        <!-- Organization -->
        <text-card class="mbl">
            <div slot="header">{{ $t('Organization') }}</div>

            <div class="inputGroupContainer">
                <!-- type -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Product type') }}</label>
                    <master-type-select
                        v-model="product.type"
                        object="product_type" />
                </div>

                <!-- sub_type -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Product sub-type') }}</label>
                    <master-type-select
                        v-model="product.sub_type"
                        object="product_sub_type" />
                </div>

                <!-- fit type -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Fit type') }}</label>
                    <master-type-select
                        v-model="product.fit_type"
                        object="product_fit_type" />
                </div>

                <!-- sales channel -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Sales channel') }}</label>
                    <master-type-select
                        v-model="product.sales_channel_type"
                        object="product_sales_channel_type" />
                </div>

                <!-- vendor -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Vendor') }}</label>
                    <master-type-select
                        v-model="product.vendor_type"
                        object="product_vendor_type"
                        :multiple="false" />
                </div>
            </div>
        </text-card>


        <!-- Details -->
        <text-card class="mbl">
            <div slot="header">{{ $t('Details') }}</div>

            <!-- page title -->
            <div class="inputGroup mrl mbm">
                <label>{{ $t('Title') }}</label>
                <b-form-input
                    v-model="product.title"
                    maxlength="70" />
            </div>

            <!-- caption -->
            <div class="inputGroup mrl mbm">
                <label>{{ $t('Caption') }}</label>
                <b-form-input
                    v-model="product.caption"
                    maxlength="70" />
            </div>

            <!-- description -->
            <div class="inputGroup mrl mbm">
                <label>{{ $t('Description') }}</label>
                <b-form-textarea
                    v-model="product.description"
                    :rows="2"
                    maxlength="320" />
            </div>
        </text-card>


        <!-- Images -->
        <text-card class="mbl">
            <div slot="header">
                {{ $t('Featured images') }}
                <span class="fs11 plm">{{ $t('You can add up to num images', {number: imageManagerMaxFeaturedImages}) }}</span>
            </div>
            <image-manager
                v-loading="loadingProductImages"
                v-model="product.images"
                :max-num-images="parseInt(imageManagerMaxFeaturedImages, 10)"
                @delete="onDeleteProductImage" />
        </text-card>


        <!-- Variants / Options -->
        <text-card class="mbl">
            <div slot="header">{{ $t('Variants') }}</div>

            <sku-manager
                :product="product"
                :max-count="3"
                :attribute-suggestions="[
                    this.$t('Size'),
                    this.$t('Color'),
                    this.$t('Material')
                ]" />
        </text-card>


        <!-- SEO -->
        <text-card class="mbl">
            <div slot="header">{{ $t('Search engine listing') }}</div>

            <!-- page title -->
            <div class="inputGroup mrl mbm">
                <label>{{ $t('Page title') }}</label>
                <b-form-input
                    v-model="product.seo_page_title"
                    maxlength="70" />
            </div>

            <!-- description -->
            <div class="inputGroup mrl mbm">
                <label>{{ $t('Description') }}</label>
                <b-form-textarea
                    v-model="product.seo_page_desc"
                    :rows="2"
                    maxlength="320" />
            </div>

            <!-- URI -->
            <div class="inputGroup mrl mbm">
                <label>{{ $t('URL and handle') }}</label>
                <b-input-group :prepend="`https://${domainName}/p/`">
                    <b-form-input
                        v-model="product.seo_uri"
                        maxlength="50" />
                </b-input-group>
            </div>

            <div class="pvl" v-show="product.seo_page_title">
                <div class="fs11 colorGray mbs">Preview:</div>
                <seo-preview
                    :title="product.seo_page_title"
                    :description="product.seo_page_desc"
                    :uri="product.seo_uri" />
            </div>
        </text-card>


        <!-- Metadata -->
        <text-card class="mbl">
            <div slot="header">{{ $t('Metadata') }}</div>

            <div class="inputGroup mrl mbm">
                <b-form-checkbox
                    v-model="productHasMetaData">{{ $t('Metadata_description') }}</b-form-checkbox>
            </div>

            <div v-if="productHasMetaData">
                <meta-data-builder v-model="product.metadata" />
            </div>
        </text-card>


        <div>
            <b-button
                variant="primary"
                @click="onSaveClick">{{ $t('Save') }}</b-button>
        </div>
    </div>
</template>
