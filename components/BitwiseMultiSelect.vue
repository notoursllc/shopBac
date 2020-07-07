<script>
export default {
    components: {
        VueSelect2: () => import('@/components/VueSelect2')
    },

    props: {
        value: {},

        placeholder: {
            type: String,
            default: ''
        },

        options: {
            type: Array,
            required: true
        },

        multiple: {
            type: Boolean,
            default: true
        }
    },

    data: function() {
        return {
            selectedVal: []
        };
    },

    watch: {
        value: {
            handler(newVal) {
                this.setSelectedValue();
            },
            immediate: true
        },

        options: {
            handler(newVal) {
                this.setSelectedValue();
            },
            immediate: true
        }
    },

    methods: {
        selectValueChanged(valueArray) {
            let total = 0;

            if(!Array.isArray(valueArray)) {
                valueArray = [valueArray];
            }

            valueArray.forEach(function(obj) {
                total += obj.value;
            });

            this.$emit('input', total);
        },

        setSelectedValue() {
            this.selectedVal = !this.multiple
                ? this.options.find((obj) => obj.value === this.value)
                : this.options.filter((obj) => obj.value & this.value);
        }
    }
};
</script>

<template>
    <vue-select2
        v-model="selectedVal"
        :multiple="multiple"
        :placeholder="placeholder"
        :options="options"
        @input="selectValueChanged"
        class="widthAll">
    </vue-select2>
</template>
