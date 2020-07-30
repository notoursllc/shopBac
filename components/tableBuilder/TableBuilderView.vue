<script>
import isObject from 'lodash.isobject';

export default {
    name: 'TableBuilderView',

    props: {
        tableData: {
            type: Object,
            default: () => {
                return {};
            }
        }
    },

    data: function() {
        return {
            selectedVal: null,
            selectOptions: []
        };
    },

    computed: {
        cols() {
            return isObject(this.tableData) ? this.tableData.columns : [];
        },

        rows() {
            return isObject(this.tableData) ? this.tableData.rows : [];
        }
    },

    // watch: {
    //     value: {
    //         handler(newVal) {
    //             this.selectedVal = newVal;
    //         },
    //         immediate: true
    //     }
    // },

    // created() {
    //     this.createOptions();
    // },

    methods: {

    }
};
</script>


<template>
    <b-table-simple
        hover
        responsive
        table-class="table-builder-table table-builder-details">
        <b-thead>
            <b-tr>
                <b-th class="th"></b-th>
                <b-th
                    v-for="(obj, index) in cols"
                    :key="index"
                    class="th">{{ obj.label }}
                </b-th>
            </b-tr>
        </b-thead>

        <b-tbody>
            <b-tr v-for="(row, idx) in rows" :key="idx">
                <b-td class="th">{{ row.label }}</b-td>
                <b-td v-for="obj in row.cells" :key="obj.columnId">{{ obj.value }}</b-td>
            </b-tr>
        </b-tbody>
    </b-table-simple>
</template>

<style lang="scss">
@import "~assets/css/components/_tableBuilderComponent.scss";
</style>
