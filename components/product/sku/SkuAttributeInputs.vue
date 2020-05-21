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
            let newValue = null;
            let newLabel = null;

            // console.log("skuVariantTypes", this.skuVariantTypes)
            // console.log("attribute", this.attribute)

            this.skuVariantTypes.forEach((obj) => {
                if(obj.id === this.attribute.optionId) {
                    // console.log("OPTION DATA SET", obj.optionData);

                    obj.optionData.forEach((option) => {
                        if(option.property === newLabelValue) {
                            newValue = option.value;
                            newLabel = option.property;
                        }
                    });
                }
            });

            this.$emit('labelChange', newLabel || newLabelValue);

            if(newValue) {
                this.selectedValue = newValue;
            }
        },

        onValueChange(val) {
            this.$emit('valueChange', val);
        },

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

        // In a normal autocomplete we would want to filter the results
        // However we always want to display all request, just like a select element, so
        // the callback always returns everything.
        // I'm doing this because it's a better UX.  If results were filtered based on the value of the
        // input, then the dropdown will only show those filtered values, making it unclear that there
        // are other options (like you would always see in a select element)
        // The reason why I am not using a select element is because the autocomplete allows the user to
        // enter his own custom value if desired, something that can't be done with a select element.
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
            <el-autocomplete
                v-model="selectedLabel"
                :fetch-suggestions="querySearch"
                size="mini"
                @input="onLabelChange"
                value-key="property"
                placeholder=""
                class="width100"
            ></el-autocomplete>
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
