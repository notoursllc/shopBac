<script>
export default {
    components: {
        InputDatalist: () => import('@/components/InputDatalist')
    },

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
        },

        datalistOptions() {
            let opts = [];
            this.skuVariantTypes.forEach((obj) => {
                if(obj.id === this.attribute.optionId) {
                    obj.optionData.forEach((obj) => {
                        opts.push({
                            label: obj.property,
                            value: obj.value
                        });
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
            let newValue = null;
            let newLabel = null;

            // console.log("skuVariantTypes", this.skuVariantTypes)
            // console.log("attribute", this.attribute)

            this.skuVariantTypes.forEach((obj) => {
                if(obj.id === this.attribute.optionId) {
                    // console.log("OPTION DATA SET", obj.optionData);

                    obj.optionData.forEach((option) => {
                        // if(option.property === newLabelValue) {
                        //     newValue = option.value;
                        //     newLabel = option.property;
                        // }
                        if(option.value === newLabelValue) {
                            newValue = option.value;
                            newLabel = option.property;
                        }
                    });
                }
            });

            this.$emit('labelChange', newLabel || newLabelValue);

            if(newValue) {
                // this.selectedValue = newValue;
                this.$emit('valueChange', newValue);
            }
        },

        onValueChange(val) {
            this.$emit('valueChange', val);
        }
    }
};
</script>

<template>
    <div class="inlineBlock">
        <!-- label -->
        <div class="labelContainer">
            <label>{{ $t('Label') }}:</label>
            <div class="inlineBlock">
                <input-datalist
                    v-model="selectedLabel"
                    :options="datalistOptions"
                    @input="onLabelChange"
                    size="sm"
                    class="width100" />
            </div>
        </div>

        <!-- value -->
        <div>
            <label>{{ $t('Value') }}:</label>
            <div class="inlineBlock">
                <b-form-input
                    v-model="selectedValue"
                    @change="onValueChange"
                    size="sm"
                    class="width100"></b-form-input>
            </div>
        </div>

    </div>
</template>

<style scoped lang="scss">
.labelContainer {
    margin-bottom: 2px;
}
</style>
