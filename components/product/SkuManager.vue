<script>
import isObject from 'lodash.isobject';
import cloneDeep from 'lodash.clonedeep';
import uuid from 'uuid/v4';
import storage_mixin from '@/mixins/storage_mixin';
import alerts_mixin from '@/mixins/alerts_mixin';

export default {
    name: 'SkuManager',

    components: {
        InputMoney: () => import('@/components/InputMoney'),
        SkuUpsertForm: () => import('@/components/product/SkuUpsertForm'),
        SkuAttributeInputs: () => import('@/components/product/sku/SkuAttributeInputs'),
        draggable: () => import('vuedraggable'),
        IconDragHandle: () => import('@/components/icons/IconDragHandle'),
        IconPlus: () => import('@/components/icons/IconPlus'),
        IconArrowRight: () => import('@/components/icons/IconArrowRight'),
        IconArrowLeft: () => import('@/components/icons/IconArrowLeft'),
        IconTrashCan: () => import('@/components/icons/IconTrashCan'),
        IconEditOutline: () => import('@/components/icons/IconEditOutline'),
        Pop: () => import('@/components/Pop'),
        PopConfirm: () => import('@/components/PopConfirm'),
        NumberInput: () => import('@/components/NumberInput')
    },

    mixins: [
        storage_mixin,
        alerts_mixin
    ],

    props: {
        product: {
            type: Object,
            default: function() {
                return {};
            }
        },

        maxNumCustomAttributes: {
            type: Number,
            default: 3
        }
    },

    data: function() {
        return {
            skuDialog: {
                show: false,
                action: 'append', // add / append
                sku: {
                    attributes: []
                }
            },
            skuVariantTypes: {
                all: [],
                selected: null,
                choose: '2'
            },
            unusedSkuVariantTypes: []
        };
    },

    computed: {
        showAddVariantButton() {
            return isObject(this.product) && this.product.id;
        },

        canAddColumn() {
            return Array.isArray(this.product.attributes) && (this.product.attributes.length < this.maxNumCustomAttributes);
        },

        canShowGrabHandles() {
            return Array.isArray(this.product.skus) && this.product.skus.length > 1;
        }
    },

    watch: {
        'product.skus': {
            handler(newVal) {
                if(Array.isArray(newVal) && !newVal.length) {
                    this.addEmptySku();
                }
            },
            immediate: true
        }
    },

    created() {
        this.getVariantTypes();
    },

    methods: {
        onClickMoreSkuInfo(index) {
            const sku = this.product.skus[index];

            this.skuDialog.sku = sku;
            this.skuDialog.action = 'append';

            this.$bvModal.show('sku_upsert_form_modal');
        },


        onSkuUpsertDone() {
            if(this.skuDialog.action === 'add') {
                this.product.skus.push(
                    cloneDeep(this.skuDialog.sku)
                );
            }

            this.resetSkuDialog();
        },


        resetSkuDialog() {
            this.skuDialog.sku = {
                attributes: []
            };
            this.skuDialog.action = 'append';
            this.$bvModal.hide('sku_upsert_form_modal');
        },


        async deleteSku(index) {
            try {
                const sku = this.product.skus[index];

                // Only delete the skus that are persisted in the DB (which have an id)
                if(sku.id) {
                    await this.$api.productSkus.delete(sku.id);
                }

                this.product.skus.splice(index, 1);

                if(sku.id) {
                    this.successMessage(this.$t('Variant deleted successfully'));
                }
            }
            catch(e) {
                this.errorMessage(e.message);
            }
        },


        onColumnMove(index, moveLeft) {
            const new_index = moveLeft ? index - 1 : index + 1;

            const removedAttrs = this.product.attributes.splice(index, 1);
            this.product.attributes.splice(new_index, 0, removedAttrs[0]);

            // the attributes in each sku need to be rearranged too:
            if(Array.isArray(this.product.skus)) {
                this.product.skus.forEach((sku) => {
                    const removed = sku.attributes.splice(index, 1);
                    sku.attributes.splice(new_index, 0, removed[0]);
                });
            }
        },


        addSkuVariantType() {
            // adding a blank attribute
            if(this.skuVariantTypes.choose === '1') {
                this.addNewProductAttribute();
                this.showAddColumnPopover(false);
                return;
            }

            for(let i=0, l=this.unusedSkuVariantTypes.length; i<l; i++) {
                if(this.unusedSkuVariantTypes[i].id === this.skuVariantTypes.selected) {
                    this.addNewProductAttribute({
                        label: this.unusedSkuVariantTypes[i].label,
                        id: this.unusedSkuVariantTypes[i].id,
                        inputType: 'select'
                    });
                    break;
                }
            }

            this.showAddColumnPopover(false);
        },


        addNewProductAttribute(newAttribute) {
            if(!newAttribute) {
                newAttribute = {
                    label: null,
                    id: uuid(),
                    inputType: 'select'
                };
            }

            this.product.attributes.push(newAttribute);

            // The product skus need to be updated as well with the new sku (variant)
            if(Array.isArray(this.product.skus)) {
                this.product.skus.forEach((sku) => {
                    sku.attributes.push({
                        optionId: newAttribute.id,
                        value: null
                    });
                });
            }

            this.recalculateUnusedSkuVariantTypes();
        },


        recalculateUnusedSkuVariantTypes() {
            const all = cloneDeep(this.skuVariantTypes.all);

            if(Array.isArray(all)) {
                const usedIds = this.product.attributes.map(obj => obj.id);

                if(usedIds.length) {
                    // remove all attributes that have already been selected:
                    let i = all.length;

                    while (i--) {
                        if(usedIds.indexOf(all[i].id) > -1) {
                            all.splice(i, 1);
                        }
                    }
                }
            }

            this.unusedSkuVariantTypes = all;
        },


        setDefaultSkuVariantSelectOption() {
            this.skuVariantTypes.selected = (Array.isArray(this.unusedSkuVariantTypes) && this.unusedSkuVariantTypes.length) ? this.unusedSkuVariantTypes[0].id : null;
        },


        onClickAddColumnButton() {
            this.setDefaultSkuVariantSelectOption();

            // if there are no more custom attributes to add then add a blank attribute
            // straight away without displaying the popup
            if(!this.unusedSkuVariantTypes.length) {
                this.addNewProductAttribute();
                this.showAddColumnPopover(false);
                return;
            }

            // Otherwise display the popover and allow the user to choose to add
            // a blank attribute or a pre-defined one
            this.showAddColumnPopover();
        },


        onClickDeleteColumn(index) {
            // Remove from device attributes
            const deletedAttributes = this.product.attributes.splice(index, 1);

            // The respective attribute needs to be removed from each sku as well:
            this.product.skus.forEach((sku) => {
                let i = sku.attributes.length;

                while (i--) {
                    if(sku.attributes[i].optionId === deletedAttributes[0].id) {
                        sku.attributes.splice(i, 1);
                    }
                }
            });

            this.recalculateUnusedSkuVariantTypes();
        },


        addEmptySku() {
            // each new sku needs to have it's attributes array pre-populated with the
            // existing attributes needed for the form
            const newSku = {
                attributes: [],
                product_id: this.product.id,
                ordinal: this.product.skus.length,
                published: true
            };

            if(Array.isArray(this.product.attributes)) {
                this.product.attributes.forEach((obj) => {
                    newSku.attributes.push({
                        optionId: obj.id,
                        value: null
                    });
                });
            }

            this.product.skus.push(newSku);
        },


        async getVariantTypes() {
            try {
                const { data } = await this.$api.productSkuVariantTypes.list();
                // console.log("VARIANT TYPES", data)
                this.skuVariantTypes.all = data;
                this.unusedSkuVariantTypes = cloneDeep(data);
            }
            catch(e) {
                this.errorMessage(e.message);
            }
        },

        setOrdinals() {
            this.product.skus.forEach((obj, index) => {
                obj.ordinal = index;
            });
        },

        canShowLeftIcon(index) {
            return this.product.attributes[index - 1];
        },

        canShowRightIcon(index) {
            return this.product.attributes[index + 1];
        },


        getVariantThumbs(variant) {
            const imageUrls = [];

            if(Array.isArray(variant.images)) {
                variant.images.forEach((img) => {

                    // setting the main image as the smallest
                    // until we can find a smaller one
                    let smallest = {
                        url: img.image_url,
                        width: img.width || 9999
                    };

                    if(Array.isArray(img.variants)) {
                        img.variants.forEach((variant) => {
                            if(variant.width && variant.image_url && variant.width < smallest.width) {
                                smallest = {
                                    url: variant.image_url,
                                    width: variant.width
                                };
                            }
                        });
                    }

                    // done going through all of the images for this variant
                    if(smallest.url) {
                        imageUrls.push(smallest.url);
                    }
                });

                return imageUrls;
            }
        },

        hideInputTypePopover(index, show) {
            const ref = this.$refs[`input-type-popover-${index}`];
            const pop = Array.isArray(ref) ? ref[0] : ref;
            pop.hide();
        },

        onInputTypePopoverReady(index) {
            const ref = this.$refs[`input-select-${index}`];
            this.focusRef(Array.isArray(ref) ? ref[0] : ref);
        },

        showAddColumnPopover(show) {
            const ref = this.$refs.add_column_popover;
            const pop = Array.isArray(ref) ? ref[0] : ref;
            if(!show) {
                pop.hide();
            }
            else {
                pop.show();
            }
        },

        onAddColumnPopoverReady() {
            this.$refs.add_column_popover_radio_custom.focus();
        },

        focusRef(ref) {
            // Some references may be a component, functional component, or plain element
            // This handles that check before focusing, assuming a `focus()` method exists
            // We do this in a double `$nextTick()` to ensure components have
            // updated & popover positioned first
            this.$nextTick(() => {
                this.$nextTick(() => {
                    ;(ref.$el || ref).focus();
                });
            });
        }
    }
};
</script>


<template>
    <div style="overflow-x:auto;">
        <table class="bv-table">
            <thead>
                <tr>
                    <th class="vabtm" :class="{'width50': canAddColumn || canShowGrabHandles}">
                        <pop
                            ref="add_column_popover"
                            @shown="onAddColumnPopoverReady">

                            <div>
                                <b-form-radio
                                    v-model="skuVariantTypes.choose"
                                    ref="add_column_popover_radio_custom"
                                    size="sm"
                                    inline
                                    name="sku-variant-type"
                                    value="2">{{ $t('Use a pre-defined attribute') }}:</b-form-radio>

                                <b-form-select
                                    v-model="skuVariantTypes.selected"
                                    size="sm">
                                    <b-form-select-option
                                        v-for="obj in unusedSkuVariantTypes"
                                        :key="obj.id"
                                        :value="obj.id">{{ obj.label }}</b-form-select-option>
                                </b-form-select>
                            </div>

                            <div class="ptl">
                                <b-form-radio
                                    v-model="skuVariantTypes.choose"
                                    size="sm"
                                    inline
                                    name="sku-variant-type"
                                    value="1">{{ $t('Use a blank attribute') }}</b-form-radio>
                            </div>

                            <div class="ptl tal">
                                <b-button
                                    variant="primary"
                                    size="sm"
                                    @click="addSkuVariantType">{{ $t('Done') }}</b-button>
                            </div>

                            <b-button
                                slot="reference"
                                v-if="canAddColumn"
                                variant="outline-secondary"
                                size="sm"
                                v-b-tooltip.hover.top="$t('Add column')"
                                @click="onClickAddColumnButton"
                                id="btn_add_variant">
                                <icon-plus
                                    width="16"
                                    height="16"
                                    stroke-width="2" />
                            </b-button>
                        </pop>
                    </th>

                    <template v-if="Array.isArray(product.attributes)">
                        <th
                            v-for="(obj, index) in product.attributes"
                            :key="index"
                            class="width125">
                            <div class="sku-item-col-icon">
                                <pop-confirm @onConfirm="onClickDeleteColumn(index);">
                                    {{ $t('Delete this column?') }}

                                    <icon-trash-can
                                        slot="reference"
                                        width="20"
                                        height="20"
                                        class="cursorPointer" />
                                </pop-confirm>


                                <!-- input type popover -->
                                <pop
                                    :ref="`input-type-popover-${index}`"
                                    @shown="onInputTypePopoverReady(index)">
                                    <div class="fs12 mbs">{{ $t('Input type') }}:</div>
                                    <b-form-select
                                        :id="`input-select-${index}`"
                                        :ref="`input-select-${index}`"
                                        v-model="product.attributes[index].inputType"
                                        size="sm">
                                        <b-form-select-option value="select">{{ $t('Select menu') }}</b-form-select-option>
                                        <b-form-select-option value="buttons">{{ $t('Buttons') }}</b-form-select-option>
                                    </b-form-select>

                                    <div class="ptl">
                                        <b-button
                                            variant="primary"
                                            size="sm"
                                            @click="hideInputTypePopover(index, false)">{{ $t('Done') }}</b-button>
                                    </div>

                                    <icon-edit-outline
                                        slot="reference"
                                        width="20"
                                        height="20"
                                        class="cursorPointer mll" />
                                </pop>
                            </div>

                            <b-input-group size="sm">
                                <template
                                    v-if="canShowLeftIcon(index)"
                                    v-slot:prepend>
                                    <b-input-group-text
                                        class="header-input"
                                        @click="onColumnMove(index, true)">
                                        <icon-arrow-left
                                            width="20"
                                            height="20"
                                            stroke-width="2" />
                                    </b-input-group-text>
                                </template>

                                <b-form-input
                                    v-model="product.attributes[index].label"></b-form-input>

                                <template
                                    v-if="canShowRightIcon(index)"
                                    v-slot:append>
                                    <b-input-group-text
                                        class="header-input"
                                        @click="onColumnMove(index, false)">
                                        <icon-arrow-right
                                            width="20"
                                            height="20"
                                            stroke-width="2" />
                                    </b-input-group-text>
                                </template>
                            </b-input-group>
                        </th>
                    </template>

                    <th class="vabtm">{{ $t('Price') }}</th>
                    <th class="vabtm input-number">{{ $t('Quantity') }}</th>
                    <th class="vabtm">{{ $t('SKU') }}</th>
                    <th class="vabtm">{{ $t('Images') }}</th>
                    <th class="vabtm"></th>
                </tr>
            </thead>

            <draggable
                v-model="product.skus"
                handle=".handle"
                @update="setOrdinals"
                ghost-class="ghost"
                tag="tbody">
                <tr v-for="(obj, idx) in product.skus" :key="obj.id">
                    <!-- drag handle -->
                    <td>
                        <i class="handle cursorGrab" v-show="canShowGrabHandles">
                            <icon-drag-handle height="20" width="20" />
                        </i>
                    </td>

                    <!-- custom attributes -->
                    <td v-for="attr in obj.attributes" :key="attr.optionId" class="attributeLabelValue">
                        <sku-attribute-inputs
                            :sku-variant-types="skuVariantTypes.all"
                            :attribute="attr"
                            :initital-label="attr.label"
                            :initital-value="attr.value"
                            @labelChange="(val) => { attr.label = val }"
                            @valueChange="(val) => { attr.value = val }" />
                    </td>

                    <!-- Price -->
                    <td>
                        <input-money v-model="obj.base_price" />
                    </td>

                    <!-- Qty -->
                    <td>
                        <number-input
                            v-model="obj.inventory_count" />
                    </td>

                    <!-- Sku -->
                    <td>
                        <b-form-input
                            v-model="obj.sku"></b-form-input>
                    </td>

                    <!-- Images -->
                    <td>
                        <span
                            v-for="(url, index) in getVariantThumbs(obj)"
                            :key="index"
                            class="variant-thumb">
                            <img :src="url">
                        </span>
                    </td>

                    <td>
                        <b-button
                            variant="outline-secondary"
                            @click="onClickMoreSkuInfo(idx)"
                            class="mrs">{{ $t('more') }}</b-button>

                        <pop-confirm @onConfirm="deleteSku(idx)">
                            {{ $t('Delete this row?') }}

                            <b-button
                                slot="reference"
                                variant="outline-secondary">
                                <icon-trash-can
                                    width="20"
                                    height="20" />
                            </b-button>
                        </pop-confirm>
                    </td>
                </tr>
            </draggable>
        </table>

        <div class="pvl" v-if="product.attributes.length">
            <b-button
                variant="primary"
                size="sm"
                @click="addEmptySku">
                {{ $t('Add row') }}</b-button>
        </div>


        <b-modal id="sku_upsert_form_modal" size="xl" hide-footer>
            <sku-upsert-form
                :sku="skuDialog.sku"
                :product-attributes="product.attributes"
                @done="onSkuUpsertDone" />
        </b-modal>
    </div>
</template>


<style lang="scss">
@import "~assets/css/components/_table.scss";
@import "~assets/css/components/_formRow.scss";
@import "~assets/css/components/_mixins.scss";

.attributeLabelValue {
    > div {
        white-space: nowrap;
        margin-bottom: 2px;

        label {
            font-size: 11px;
            padding-right: 3px
        }

        &:last-child {
            margin: 0;
        }
    }
}

.input-number {
    width: 105px;
}

.vertAlignBottom {
    vertical-align: bottom;
}

.ghost {
    opacity: 0.5;
    background: #c8ebfb;
}

.variant-label {
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
}

.header-input {
    padding: 2px 1px !important;
    cursor: pointer;
}

.sku-item-col-icon {
    text-align: center;
    margin-bottom: 3px;
    font-size: 16px;
}

.variant-thumb {
    width: 40px;
    margin-right: 5px;
    display: inline-block;

    img {
        width: 100%;
    }
}

</style>
