<script>
import isObject from 'lodash.isobject';
import cloneDeep from 'lodash.clonedeep';
// import draggable from 'vuedraggable';
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
        IconDragHandle: () => import('@/components/icons/IconDragHandle')
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
            addColumnPopoverVisible: false,
            skuVariantTypes: {
                all: [],
                selected: null,
                choose: '1'
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
                    await this.$api.products.deleteSku(sku.id);
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
                this.addColumnPopoverVisible = false;
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

            this.addColumnPopoverVisible = false;
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
                this.addColumnPopoverVisible = false;
                return;
            }

            // Otherwise display the popover and allow the user to choose to add
            // a blank attribute or a pre-defined one
            this.addColumnPopoverVisible = true;
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
                ordinal: this.product.skus.length
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
        }
    }
};
</script>


<template>
    <div style="overflow-x:auto">
        <table class="table">
            <thead>
                <tr>
                    <th class="vabtm" :class="{'width50': canAddColumn || canShowGrabHandles}">
                        <!-- choose custom attribute popover -->
                        <el-popover
                            ref="attributePopover"
                            placement="top"
                            trigger="manual"
                            content="this is content, this is content, this is content"
                            v-model="addColumnPopoverVisible">
                            <div>
                                <el-radio
                                    v-model="skuVariantTypes.choose"
                                    label="1"
                                    border
                                    class="widthAll">Add a blank attribute</el-radio>
                            </div>
                            <div class="ptm">
                                <el-radio
                                    v-model="skuVariantTypes.choose"
                                    label="2"
                                    border
                                    class="widthAll">Add a pre-defined attribute</el-radio>

                                <div class="pts" v-show="skuVariantTypes.choose === '2'">
                                    <el-select
                                        v-model="skuVariantTypes.selected"
                                        size="small"
                                        class="widthAll"
                                        placeholder="Choose a pre-defined attribute">
                                        <el-option
                                            v-for="obj in unusedSkuVariantTypes"
                                            :key="obj.id"
                                            :label="obj.label"
                                            :value="obj.id"></el-option>
                                    </el-select>
                                </div>
                            </div>

                            <div class="ptl tac">
                                <el-button
                                    type="primary"
                                    size="mini"
                                    @click="addSkuVariantType">{{ $t('Done') }}</el-button>
                            </div>
                        </el-popover>

                        <div class="inlineBlock" v-popover:attributePopover>
                            <el-tooltip
                                v-if="canAddColumn"
                                effect="dark"
                                :content="$t('Add column')"
                                placement="top-start">
                                <el-button
                                    @click="onClickAddColumnButton"
                                    size="mini"
                                    icon="el-icon-plus"></el-button>
                            </el-tooltip>
                        </div>
                    </th>

                    <template v-if="Array.isArray(product.attributes)">
                        <th
                            v-for="(obj, index) in product.attributes"
                            :key="index"
                            class="width125">
                            <div class="sku-item-col-icon">
                                <el-popconfirm
                                    :title="$t('Delete this column?')"
                                    :confirmButtonText="$t('OK')"
                                    :cancelButtonText="$t('cancel')"
                                    @onConfirm="onClickDeleteColumn(index)">
                                    <i slot="reference" class="el-icon-delete mrl cursorPointer" />
                                </el-popconfirm>

                                <!-- input type -->
                                <el-popover
                                    placement="top-start"
                                    width="200"
                                    trigger="click">
                                    <i slot="reference" class="el-icon-edit-outline cursorPointer" />
                                    <div class="tac">
                                        {{ $t('Input type') }}:
                                        <el-select v-model="product.attributes[index].inputType" size="mini">
                                            <el-option label="Select menu" value="select"></el-option>
                                            <el-option label="Buttons" value="buttons"></el-option>
                                        </el-select>
                                    </div>
                                </el-popover>
                            </div>

                            <el-input
                                v-model="product.attributes[index].label"
                                size="mini"
                                placeholder="Add column"
                                class="header-input">
                                <i slot="prepend"
                                   class="el-icon-back"
                                   v-if="canShowLeftIcon(index)"
                                   @click="onColumnMove(index, true)" />

                                <i slot="append"
                                   class="el-icon-right"
                                   v-if="canShowRightIcon(index)"
                                   @click="onColumnMove(index, false)" />
                            </el-input>
                        </th>
                    </template>

                    <th class="vabtm">{{ $t('Price') }}</th>
                    <th class="vabtm input-number">{{ $t('Quantity') }}</th>
                    <th class="vabtm">{{ $t('SKU') }}</th>
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
                            <icon-drag-handle
                                icon-name="drag-handle"
                                width="15px"
                                class-name="fillGrayLight" />
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


        <app-dialog :visible.sync="skuDialog.show">
            <sku-upsert-form
                :sku="skuDialog.sku"
                :product-attributes="product.attributes"
                @done="onSkuUpsertDone" />
        </app-dialog>
    </div>
</template>


<style lang="scss">
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
    .el-input-group__prepend,
    .el-input-group__append {
        padding: 0 3px;
        cursor: pointer;
    }
}

.sku-item-col-icon {
    text-align: center;
    margin-bottom: 3px;
    font-size: 16px;
}

</style>
