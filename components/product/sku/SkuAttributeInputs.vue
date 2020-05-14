

<script>
export default {
    props: {
        skuVariantTypes: {
            type: Array,
            default: () => {
                return [];
            }
        },

        attribute: {
            type: Object,
            default: () => {
                return {};
            }
        },

        inititalLabel: {
            type: String,
            default: ''
        },

        inititalValue: {
            type: String,
            default: ''
        }
    },

    data: function() {
        return {
            selectedLabel: null,
            selectedValue: null
        };
    },

    computed: {
        showBlankAttributeInput() {
            let isBlank = true;
            this.skuVariantTypes.forEach((obj) => {
                if(obj.id === this.attribute.optionId) {
                    isBlank = false;
                }
            });
            return isBlank;
        },

        // customAttributeOptions() {
        //     let opts = [];
        //     this.skuVariantTypes.forEach((obj) => {
        //         if(obj.id === this.attribute.optionId) {
        //             opts = obj.optionData.map(opt => {
        //                 return {
        //                     value: opt.property
        //                 };
        //             });
        //         }
        //     });
        //     return opts;
        // }

        customAttributeOptions() {
            let opts = [];
            this.skuVariantTypes.forEach((obj) => {
                if(obj.id === this.attribute.optionId) {
                    opts = obj.optionData.map(opt => {
                        return opt;
                    });
                }
            });
            return opts;
        }
    },

    watch: {
        inititalLabel: {
            handler(newVal) {
                this.selectedLabel = newVal;
            },
            immediate: true
        },

        inititalValue: {
            handler(newVal) {
                this.selectedValue = newVal;
            },
            immediate: true
        }
    },

    methods: {
        onLabelChange(newLabelValue) {
            console.log("label change", newLabelValue)

            if(this.showBlankAttributeInput) {
                this.$emit('labelChange', newLabelValue);
                return;
            }

            if(!this.showBlankAttributeInput) {
                let newValue = null;
                let newLabel = null;

                console.log("skuVariantTypes", this.skuVariantTypes)
                console.log("attribute", this.attribute)

                this.skuVariantTypes.forEach((obj) => {
                    if(obj.id === this.attribute.optionId) {
                        console.log("OPTION DATA SET", obj.optionData);

                        obj.optionData.forEach((option) => {
                            if(option.property === newLabelValue) {
                                newValue = option.value;
                                newLabel = option.property;
                            }
                        });
                    }
                });

                // if(newLabel) {
                //     this.$emit('labelChange', newLabel);
                // }

                // if(newValue) {
                //     this.selectedValue = newValue;
                //     this.onValueChange(newValue);
                // }

                this.$emit('labelChange', newLabel);
                this.selectedValue = newValue;
                this.onValueChange(newValue);
            }
        },

        onValueChange(val) {
            console.log("value change", val)
            this.$emit('valueChange', val);
        },

        // createFilter(queryString) {
        //     return (obj) => {
        //         // console.log("QS LABEL", queryString, obj)
        //         return (obj.label.toLowerCase().indexOf(queryString.toLowerCase()) === 0);
        //     };
        // },
        // createFilter(queryString) {
        //     return (obj) => {
        //         console.log("QS LABEL", queryString, obj);
        //         return (obj.property.toLowerCase().indexOf(queryString.toLowerCase()) === 0);
        //     };
        // },

        // querySearch(queryString, cb) {
        //     const opts = this.customAttributeOptions;
        //     console.log("QS OPTS", opts)
        //     const results = queryString ? opts.filter(this.createFilter(queryString)) : opts;
        //     cb(results);
        // }

        querySearch(queryString, cb) {
            cb(this.customAttributeOptions);
        }
    }
};
</script>

<template>
    <div class="inlineBlock">
        <!-- label -->
        <div class="labelContainer">
            <label>{{ $t('Label') }}:</label>
            <el-input
                v-if="showBlankAttributeInput"
                v-model="selectedLabel"
                @input="onLabelChange"
                size="mini"
                class="width100" />
            <el-autocomplete
                v-else
                v-model="selectedLabel"
                :fetch-suggestions="querySearch"
                size="mini"
                @input="onLabelChange"
                value-key="property"
                placeholder=""
                class="width100"
            ></el-autocomplete>
            <!-- <el-select
                v-else
                v-model="selectedLabel"
                @change="onLabelChange"
                size="mini"
                class="width100"
                placeholder="">
                <el-option
                    v-for="(opt, index) in customAttributeOptions"
                    :key="index"
                    :label="opt.label"
                    :value="opt.value"></el-option>
            </el-select> -->
        </div>

        <!-- value -->
        <div>
            <label>{{ $t('Value') }}:</label>
            <el-input
                v-model="selectedValue"
                @change="onValueChange"
                size="mini"
                class="width100" />
        </div>

    </div>
</template>

<style scoped lang="scss">
.labelContainer {
    margin-bottom: 2px;
}
</style>
