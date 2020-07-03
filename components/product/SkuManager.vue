<script>
import Vue from 'vue';
import isObject from 'lodash.isobject';
import cloneDeep from 'lodash.clonedeep';
import uuid from 'uuid/v4';
import storage_mixin from '@/mixins/storage_mixin';

export default {
    name: 'SkuManager',

    components: {
        InputMoney: () => import('@/components/InputMoney'),
        AppDialog: () => import('@/components/AppDialog'),
        SkuUpsertForm: () => import('@/components/product/SkuUpsertForm'),
        SkuAttributeInputs: () => import('@/components/product/sku/SkuAttributeInputs'),
        draggable: () => import('vuedraggable'),
        IconDragHandle: () => import('@/components/icons/IconDragHandle'),
        IconPlus: () => import('@/components/icons/IconPlus'),
        IconArrowRight: () => import('@/components/icons/IconArrowRight'),
        IconArrowLeft: () => import('@/components/icons/IconArrowLeft'),
        PopConfirm: () => import('@/components/PopConfirm')
    },

    mixins: [
        storage_mixin
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
            visibleInputTypePopovers: [],
            visibleConfirmDeletePopovers: [],
            addColumnPopoverVisible: false,
            addColumnOverlayVisible: false,
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
            this.skuDialog.show = true;
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
            this.skuDialog.show = false;
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
                    this.$successMessage(this.$t('Variant deleted successfully'));
                }
            }
            catch(e) {
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
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
                // this.addColumnPopoverVisible = false;
                this.addColumnOverlayVisible = false;
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

            // this.addColumnPopoverVisible = false;
            this.addColumnOverlayVisible = false;
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
                // this.addColumnPopoverVisible = false;
                this.addColumnOverlayVisible = false;
                return;
            }

            // Otherwise display the popover and allow the user to choose to add
            // a blank attribute or a pre-defined one
            // this.addColumnPopoverVisible = true;
            this.addColumnOverlayVisible = true;
        },


        onClickDeleteColumn(index) {
            this.hideAllPopovers();

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
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
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

        hideAllPopovers() {
            this.visibleInputTypePopovers.forEach((val, i) => {
                Vue.set(this.visibleInputTypePopovers, i, false);
            });
            this.visibleConfirmDeletePopovers.forEach((val, i) => {
                Vue.set(this.visibleConfirmDeletePopovers, i, false);
            });
        },

        showInputTypePopover(index, show) {
            if(show) {
                this.hideAllPopovers();
            }
            Vue.set(this.visibleInputTypePopovers, index, show);
        },

        showConfirmDeletePopover(index, show) {
            if(show) {
                this.hideAllPopovers();
            }
            Vue.set(this.visibleConfirmDeletePopovers, index, show);
        }
    }
};
</script>


<template>
    <div style="min-height:150px; overflow-x:auto;">

        <b-overlay :show="addColumnOverlayVisible" no-center>
            <template v-slot:overlay>
                <div class="vat">
                    <div class="fwb">{{ $t('Adding a new column') }}:</div>
                    <div class="mtm">
                        <div>
                            <b-form-radio
                                v-model="skuVariantTypes.choose"
                                size="sm"
                                inline
                                name="sku-variant-type"
                                value="2">{{ $t('Choose a pre-defined attribute') }}:</b-form-radio>

                            <b-form-select
                                v-model="skuVariantTypes.selected"
                                size="sm"
                                class="width150"
                                placeholder="Choose a pre-defined attribute">
                                <b-form-select-option
                                    v-for="obj in unusedSkuVariantTypes"
                                    :key="obj.id"
                                    :value="obj.id">{{ obj.label }}</b-form-select-option>
                            </b-form-select>
                        </div>

                        <div class="ptm">
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
                    </div>
                </div>
            </template>

            <table class="table" id="popover-target">
                <thead>
                    <tr>
                        <th class="vabtm" :class="{'width50': canAddColumn || canShowGrabHandles}">
                            <b-button
                                v-if="canAddColumn"
                                variant="outline-secondary"
                                size="sm"
                                v-b-tooltip.hover.top="$t('Add column')"
                                @click="onClickAddColumnButton"
                                id="btn_add_variant">
                                <icon-plus
                                    width="16"
                                    height="16" />
                            </b-button>
                        </th>

                        <template v-if="Array.isArray(product.attributes)">
                            <th
                                v-for="(obj, index) in product.attributes"
                                :key="index"
                                class="width125">
                                <div class="sku-item-col-icon">
                                    <i :id="`popover-target-trash-${index}`"
                                       @click="showConfirmDeletePopover(index, true)"
                                       class="el-icon-delete mrl cursorPointer" />

                                    <i :id="`popover-target-edit-${index}`"
                                       @click="showInputTypePopover(index, true)"
                                       class="el-icon-edit-outline cursorPointer" />

                                    <pop-confirm
                                        :target="`popover-target-trash-${index}`"
                                        :show.sync="visibleConfirmDeletePopovers[index]"
                                        @onConfirm="onClickDeleteColumn(index);"
                                        @onCancel="showConfirmDeletePopover(index, false)">
                                        {{ $t('Delete this column?') }}
                                    </pop-confirm>

                                    <!-- input type popover -->
                                    <b-popover
                                        :target="`popover-target-edit-${index}`"
                                        :show.sync="visibleInputTypePopovers[index]"
                                        placement="top">
                                        <template v-slot:title>{{ $t('Input type') }}:</template>

                                        <b-form-select
                                            v-model="product.attributes[index].inputType"
                                            size="sm">
                                            <b-form-select-option value="select">{{ $t('Select menu') }}</b-form-select-option>
                                            <b-form-select-option value="buttons">{{ $t('Buttons') }}</b-form-select-option>
                                        </b-form-select>

                                        <div class="ptm">
                                            <b-button
                                                variant="primary"
                                                size="sm"
                                                @click="showInputTypePopover(index, false)">{{ $t('Done') }}</b-button>
                                        </div>
                                    </b-popover>
                                </div>

                                <b-input-group size="sm">
                                    <template
                                        v-if="canShowLeftIcon(index)"
                                        v-slot:prepend>
                                        <b-input-group-text
                                            class="header-input"
                                            @click="onColumnMove(index, true)">
                                            <icon-arrow-left width="20" height="20" />
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
                                            <icon-arrow-right width="20" height="20" />
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
                            <el-input-number
                                v-model="obj.inventory_count"
                                :min="0"
                                :step="1"
                                controls-position="right"
                                step-strictly />
                        </td>

                        <!-- Sku -->
                        <td>
                            <el-input v-model="obj.sku" />
                        </td>

                        <!-- Images -->
                        <td>
                            <span v-for="(url, index) in getVariantThumbs(obj)"
                                :key="index"
                                class="variant-thumb">
                                <img :src="url" c>
                            </span>
                        </td>

                        <td>
                            <el-button-group>
                                <el-button @click="onClickMoreSkuInfo(idx)">{{ $t('more') }}</el-button>

                                <el-popconfirm
                                    :title="$t('Delete this row?')"
                                    :confirmButtonText="$t('OK')"
                                    :cancelButtonText="$t('cancel')"
                                    @onConfirm="deleteSku(idx)">
                                    <el-button slot="reference" icon="el-icon-delete"></el-button>
                                </el-popconfirm>
                            </el-button-group>
                        </td>
                    </tr>
                </draggable>
            </table>

            <div class="pvl" v-if="product.attributes.length">
                <el-button
                    type="primary"
                    @click="addEmptySku"
                    size="mini">{{ $t('Add row') }}</el-button>
            </div>
        </b-overlay>


        <app-dialog :visible.sync="skuDialog.show">
            <sku-upsert-form
                :sku="skuDialog.sku"
                :product-attributes="product.attributes"
                @done="onSkuUpsertDone" />
        </app-dialog>
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

.el-popconfirm__action {
    margin-top: 10px;
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

// .header-input {
//     .el-input-group__prepend,
//     .el-input-group__append {
//         padding: 0 3px;
//         cursor: pointer;
//     }
// }

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
