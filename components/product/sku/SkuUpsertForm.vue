<script>
import isObject from 'lodash.isobject';
import storage_mixin from '@/mixins/storage_mixin'; // TODO: not needed?

export default {
    name: 'SkuUpsertForm',

    components: {
        InputMoney: () => import('@/components/InputMoney'),
        TextCard: () => import('@/components/TextCard'),
        CountrySelect: () => import('@/components/CountrySelect'),
        ImageManager: () => import('@/components/product/ImageManager'),
        SkuAttributeInputs: () => import('@/components/product/sku/SkuAttributeInputs'),
        DataTableWizard: () => import('@/components/product/dataTable/DataTableWizard'),
        NumberInput: () => import('@/components/NumberInput'),
        AppOverlay: () => import('@/components/AppOverlay')
    },

    mixins: [
        storage_mixin
    ],

    props: {
        sku: {
            type: Object,
            default: function() {
                return {};
            }
        },

        productAttributes: {
            type: Array,
            default: function() {
                return [];
            }
        }
    },

    data: function() {
        return {
            imageManagerMaxImages: process.env.SKU_IMAGE_MANAGER_MAX_IMAGES || 3,
            loadingImages: false,
            skuVariantTypes: []
        };
    },

    computed: {
        tableColumnLabels() {
            if(Array.isArray(this.productAttributes)) {
                return this.productAttributes.map(obj => obj.label);
            }
            return [];
        },

        showAttributes() {
            return this.sku.attributes.length;
        }
    },

    watch: {
        sku: {
            handler(newVal) {
                if(isObject(newVal)) {
                    if(!Array.isArray(newVal.images)) {
                        newVal.images = [];
                    }
                }
            },
            immediate: true
        }
    },

    created() {
        this.getVariantTypes();
    },

    methods: {
        onClickDone() {
            this.$emit('done');
        },

        async getVariantTypes() {
            try {
                const { data } = await this.$api.productSkuVariantTypes.list();
                this.skuVariantTypes = data;
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        async onDeleteSkuImage(id) {
            try {
                this.loadingImages = true;
                await this.$api.productSkus.deleteImage(id);
                this.$successToast(this.$t('Image deleted successfully'));
            }
            catch(e) {
                this.$errorToast(e.message);
            }

            this.loadingImages = false;
        }
    }
};
</script>


<template>
    <div>

        <!-- published-->
        <div class="mbl">
            <b-form-checkbox
                v-model="sku.published">{{ $t('This SKU is available for purchase') }}</b-form-checkbox>
        </div>

        <!-- attributes -->
        <text-card v-if="showAttributes" class="mbxl">
            <div slot="header">{{ $t('Attributes') }}</div>

            <div class="inputGroupContainer">
                <div v-for="(label, index) in tableColumnLabels"
                     :key="index"
                     class="inputGroup mrl mbm">
                    <label class="fwb tac pbs">{{ label }}</label>
                    <div v-if="sku.attributes[index]" class="fs12">
                        <sku-attribute-inputs
                            :sku-variant-types="skuVariantTypes"
                            :attribute="sku.attributes[index]"
                            :initital-label="sku.attributes[index].label"
                            :initital-value="sku.attributes[index].value"
                            @labelChange="(val) => { sku.attributes[index].label = val }"
                            @valueChange="(val) => { sku.attributes[index].value = val }" />
                    </div>
                </div>
            </div>
        </text-card>


        <!-- pricing -->
        <text-card class="mbxl">
            <div slot="header">{{ $t('Pricing') }}</div>

            <div class="inputGroupContainer">
                <!-- price -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Price') }}</label>
                    <input-money
                        v-model="sku.base_price" />
                </div>

                <!-- compare at price -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Compare at price') }}</label>
                    <input-money
                        v-model="sku.compare_at_price" />
                </div>

                <!-- cost pre item -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Cost per item') }}</label>
                    <span>
                        <input-money
                            v-model="sku.cost_price" />
                        <div class="fs12 colorGrayLighter">{{ $t('Customers won’t see this') }}</div>
                    </span>
                </div>
            </div>

            <!-- Charge tax on this product -->
            <div class="mtm">
                <b-form-checkbox
                    v-model="sku.is_taxable">{{ $t('Charge tax on this product') }}</b-form-checkbox>
            </div>
        </text-card>


        <!-- Images -->
        <text-card class="mbxl">
            <template v-slot:header>{{ $t('Images') }}</template>
            <template v-slot:headerSub>{{ $t('You can add up to num images', {number: imageManagerMaxImages}) }}</template>

            <app-overlay :show="loadingImages">
                <image-manager
                    v-model="sku.images"
                    @delete="onDeleteSkuImage"
                    :max-num-images="parseInt(imageManagerMaxImages, 10)" />
            </app-overlay>
        </text-card>


        <!-- data table -->
        <text-card  class="mbxl">
            <template v-slot:header>{{ $t('Data table') }}</template>
            <template v-slot:headerSub>{{ $t('data_table_subheader') }}</template>

            <div class="inputGroupContainer">
                <data-table-wizard
                    v-model="sku.data_table" />
            </div>
        </text-card>


        <!-- inventory -->
        <text-card class="mbxl">
            <div slot="header">{{ $t('Inventory') }}</div>

            <div class="inputGroupContainer">
                <!-- qty -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Quantity') }}</label>
                    <number-input
                        v-model="sku.inventory_count"
                        :min="0"
                        class="input-number" />
                </div>

                <!-- sku -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('SKU (Stock Keeping Unit)') }}</label>
                    <b-form-input
                        v-model="sku.sku" />
                </div>

                <!-- barcode -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Barcode (ISBN, UPC, GTIN, etc.)') }}</label>
                    <b-form-input
                        v-model="sku.barcode" />
                </div>
            </div>

            <!-- track quantity -->
            <div class="mtm">
                <b-form-checkbox
                    v-model="sku.track_quantity">{{ $t('Track quantity') }}</b-form-checkbox>
            </div>

            <!-- Continue selling when out of stock -->
            <div class="mtm">
                <b-form-checkbox
                    v-model="sku.visible_if_out_of_stock">{{ $t('Continue selling when out of stock') }}</b-form-checkbox>
            </div>
        </text-card>


        <!-- shipping -->
        <text-card class="mbxl">
            <div slot="header">{{ $t('Shipping') }}</div>

            <div class="inputGroupContainer">
                <!-- weight -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Weight (oz)') }}</label>
                    <number-input
                        v-model="sku.weight_oz"
                        :step=".01"
                        :min="0"
                        class="input-number" />
                </div>
            </div>

            <hr />

            <h4>{{ $t('CUSTOMS INFORMATION') }}</h4>

            <div class="inputGroupContainer">
                <!-- country of origin -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('Country of origin') }}</label>
                    <country-select
                        v-model="sku.customs_country_of_origin" />
                    <div class="colorGrayLighter">{{ $t('customs_country_of_origin_desc') }}</div>
                </div>

                <!-- hs code -->
                <div class="inputGroup mrl mbm">
                    <label>{{ $t('HS (Harmonized System) code') }}</label>
                    <b-form-input
                        v-model="sku.customs_harmonized_system_code" />
                    <div class="colorGrayLighter">{{ $t('customs_hs_code_desc') }}</div>
                </div>
            </div>
        </text-card>


        <div class="tac">
            <b-button
                variant="primary"
                @click="onClickDone">{{ $t('Done') }}</b-button>
        </div>
    </div>
</template>


<style lang="scss">
@import "~assets/css/components/_formRow.scss";

.input-number {
    width: 150px;
}
</style>
