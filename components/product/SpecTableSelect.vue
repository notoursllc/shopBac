<script>
export default {
    name: 'SpecTableSelect',

    inheritAttrs: false,

    props: {
        value: {
            type: String,
            default: null
        }
    },

    data: function() {
        return {
            selectedVal: null,
            selectOptions: []
        };
    },

    watch: {
        value: {
            handler(newVal) {
                this.selectedVal = newVal;
            },
            immediate: true
        }
    },

    created() {
        this.createOptions();
    },

    methods: {
        emitInput(val) {
            this.$emit('input', val);
        },

        async createOptions() {
            const specTables = await this.$api.productSpecTables.all();

            this.selectOptions = specTables.map(obj => {
                return {
                    text: obj.name,
                    value: obj.id
                };
            });
        }
    }
};
</script>


<template>
    <b-form-select
        v-model="selectedVal"
        :options="selectOptions"
        v-bind="$attrs"
        @input="emitInput"></b-form-select>
</template>
