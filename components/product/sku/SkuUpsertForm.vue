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
            imageManagerMaxImages: process.env.SKU_IMAGE_MANAGER_MAX_IMAGES || 6,
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

            <b-container>
                <b-row>
                    <b-col
                        sm="6"
                        lg="2"
                        v-for="(label, index) in tableColumnLabels"
                        :key="index">

                        <b-form-group :label="label">
                            <div v-if="sku.attributes[index]" class="fs12">
                                <sku-attribute-inputs
                                    :sku-variant-types="skuVariantTypes"
                                    :attribute="sku.attributes[index]"
                                    :initital-label="sku.attributes[index].label"
                                    :initital-value="sku.attributes[index].value"
                                    @labelChange="(val) => { sku.attributes[index].label = val }"
                                    @valueChange="(val) => { sku.attributes[index].value = val }" />
                            </div>
                        </b-form-group>

                    </b-col>
                </b-row>
            </b-container>
        </text-card>


        <!-- pricing -->
        <text-card class="mbxl">
            <div slot="header">{{ $t('Pricing') }}</div>

            <b-container>
                <b-row>
                    <!-- price -->
                    <b-col sm="12" lg="4">
                        <b-form-group
                            :label="$t('Price') "
                            label-for="sku_base_price">
                            <input-money
                                v-model="sku.base_price"
                                id="sku_base_price" />
                        </b-form-group>
                    </b-col>

                    <!-- compare at price -->
                    <b-col sm="12" lg="4">
                        <b-form-group
                            :label="$t('Compare at price') "
                            label-for="sku_compare_at_price">
                            <input-money
                                v-model="sku.compare_at_price"
                                id="sku_compare_at_price" />
                        </b-form-group>
                    </b-col>

                    <!-- cost pre item -->
                    <b-col sm="12" lg="4">
                        <b-form-group
                            :label="$t('Cost per item') "
                            label-for="sku_cost_price"
                            :description="$t('Customers won’t see this')">
                            <input-money
                                v-model="sku.cost_price"
                                id="sku_cost_price" />
                        </b-form-group>
                    </b-col>
                </b-row>

                <b-row>
                    <!-- Charge tax on this product -->
                    <b-col lg="12">
                        <b-form-group>
                            <b-form-checkbox
                                v-model="sku.is_taxable">{{ $t('Charge tax on this product') }}</b-form-checkbox>
                        </b-form-group>
                    </b-col>
                </b-row>
            </b-container>

        </text-card>


        <!-- Images -->
        <text-card class="mbxl">
            <template v-slot:header>{{ $t('Images') }}</template>
            <template v-slot:headerSub>{{ $t('You can add up to num images', {number: imageManagerMaxImages}) }}</template>

            <b-container>
                <app-overlay :show="loadingImages">
                    <image-manager
                        v-model="sku.images"
                        @delete="onDeleteSkuImage"
                        :max-num-images="parseInt(imageManagerMaxImages, 10)" />
                </app-overlay>
            </b-container>
        </text-card>


        <!-- data table -->
        <text-card  class="mbxl">
            <template v-slot:header>{{ $t('Data table') }}</template>
            <template v-slot:headerSub>{{ $t('data_table_subheader') }}</template>

            <b-container>
                <b-form-group>
                    <data-table-wizard
                        v-model="sku.data_table" />
                </b-form-group>
            </b-container>
        </text-card>


        <!-- inventory -->
        <text-card class="mbxl">
            <div slot="header">{{ $t('Inventory') }}</div>

            <b-container>
                <b-row>
                    <!-- qty -->
                    <b-col sm="12" lg="4">
                        <b-form-group
                            :label="$t('Quantity') "
                            label-for="sku_inventory_count">
                            <number-input
                                v-model="sku.inventory_count"
                                :min="0"
                                id="sku_inventory_count" />
                        </b-form-group>
                    </b-col>

                    <!-- sku -->
                    <b-col sm="12" lg="4">
                        <b-form-group
                            :label="$t('SKU (Stock Keeping Unit)')"
                            label-for="sku_sku">
                            <b-form-input
                                v-model="sku.sku"
                                id="sku_sku" />
                        </b-form-group>
                    </b-col>

                    <!-- barcode -->
                    <b-col sm="12" lg="4">
                        <b-form-group
                            :label="$t('Barcode')"
                            label-for="sku_barcode"
                            :description="$t('sku_barcode_description')">
                            <b-form-input
                                v-model="sku.barcode"
                                id="sku_barcode" />
                        </b-form-group>
                    </b-col>
                </b-row>

                <b-row>
                    <!-- track quantity -->
                    <b-col lg="12">
                        <b-form-group>
                            <b-form-checkbox
                                v-model="sku.track_quantity">{{ $t('Track quantity') }}</b-form-checkbox>
                        </b-form-group>
                    </b-col>
                </b-row>

                <b-row>
                    <!-- Continue selling when out of stock -->
                    <b-col lg="12">
                        <b-form-group>
                            <b-form-checkbox
                                v-model="sku.visible_if_out_of_stock">{{ $t('Continue selling when out of stock') }}</b-form-checkbox>
                        </b-form-group>
                    </b-col>
                </b-row>
            </b-container>

        </text-card>


        <!-- shipping -->
        <text-card class="mbxl">
            <div slot="header">{{ $t('Shipping') }}</div>

            <b-container>
                <!-- requires shipping -->
                <b-form-group>
                    <b-form-checkbox
                        v-model="sku.requires_shipping">{{ $t('This is a physical product') }}</b-form-checkbox>
                </b-form-group>

                <template v-if="!sku.requires_shipping">
                    {{ $t('requires_shipping_off_desc') }}
                </template>

                <template v-else>
                    <hr />

                    <b-row>
                        <b-col lg="12">
                            <template v-if="sku.requires_shipping">
                                <b-form-group
                                    :label="$t('Weight (oz)')"
                                    label-for="sku_weight_oz"
                                    :description="$t('Used to calculate shipping rates at checkout and label prices during fulfillment.')">
                                    <number-input
                                        v-model="sku.weight_oz"
                                        :step=".01"
                                        :min="0"
                                        class="input-number"
                                        id="sku_weight_oz" />
                                </b-form-group>
                            </template>

                        </b-col>
                    </b-row>

                    <hr />

                    <h4>{{ $t('CUSTOMS INFORMATION') }}</h4>

                    <b-row>
                        <b-col sm="12" lg="6">
                            <!-- country of origin -->
                            <b-form-group
                                :label="$t('Country of origin')"
                                label-for="sku_customs_country_of_origin"
                                :description="$t('customs_country_of_origin_desc')">
                                <country-select
                                    v-model="sku.customs_country_of_origin"
                                    id="sku_customs_country_of_origin" />
                            </b-form-group>
                        </b-col>

                        <b-col sm="12" lg="6">
                            <!-- HS code -->
                            <b-form-group
                                :label="$t('HS (Harmonized System) code')"
                                label-for="sku_customs_harmonized_system_code"
                                :description="$t('customs_hs_code_desc')">
                                <b-form-input
                                    v-model="sku.customs_harmonized_system_code"
                                    id="sku_customs_harmonized_system_code" />
                            </b-form-group>
                        </b-col>
                    </b-row>
                </template>
            </b-container>

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
