<script>
export default {
    name: 'DataTableSelect',

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
            const dataTables = await this.$api.productDataTables.all();

            this.selectOptions = dataTables.map(obj => {
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
