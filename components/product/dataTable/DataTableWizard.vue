<script>
import isObject from 'lodash.isobject';

export default {
    name: 'DataTableWizard',

    components: {
        TableBuilder: () => import('@/components/tableBuilder/TableBuilder'),
        TableBuilderView: () => import('@/components/tableBuilder/TableBuilderView'),
        DataTableSelect: () => import('@/components/product/dataTable/DataTableSelect'),
        IconArrowRight: () => import('@/components/icons/IconArrowRight'),
        AppOverlay: () => import('@/components/AppOverlay')
    },

    inheritAttrs: false,

    props: {
        value: {
            type: [String, Object],
            default: null
        }
    },

    data: function() {
        return {
            loading: false,
            actionSelectOptions: [
                { text: this.$t('None'), value: null },
                { text: this.$t('Use pre-defined'), value: 'pre' },
                { text: this.$t('Create new'), value: 'create' }
            ],
            selectedValue: null,
            dataTableSelectValue: null,
            action: null,
            readOnlyTableData: null,
            tableBuilderData: null,
            showImportOptions: false
        };
    },

    watch: {
        value: {
            handler(newVal) {
                if(newVal) {
                    if(isObject(newVal)) {
                        this.action = this.actionSelectOptions[2].value;
                        this.tableBuilderData = newVal;
                    }
                    else {
                        this.action = this.actionSelectOptions[1].value;
                        this.dataTableSelectValue = newVal;
                        this.fetchDataForReadOnlyTable(newVal);
                    }
                }
            },
            immediate: true
        }
    },

    methods: {
        async fetchDataTable(id) {
            if(!id) {
                return;
            }

            this.loading = true;
            let tableData;

            try {
                tableData = await this.$api.productDataTables.get(id);

                if(!tableData) {
                    throw new Error(this.$t('Data Table not found'));
                }
            }
            catch(e) {
                this.$errorToast(e.message);
            }

            this.loading = false;
            return tableData;
        },

        onDataTableSelectChange(val) {
            this.selectedValue = val;
            this.emitInput();

            // fetch the data for <table-builder-view>
            this.fetchDataForReadOnlyTable(val);
        },

        async fetchDataForReadOnlyTable(dataTableId) {
            const results = await this.fetchDataTable(dataTableId);
            this.readOnlyTableData = isObject(results) ? results.table_data : null;
        },

        emitInput() {
            this.$emit('input', this.selectedValue);
        },

        onTableBuilderChange() {
            this.selectedValue = Object.assign({}, this.tableBuilderData);
            this.emitInput();
        },

        onActionSelectChange(val) {
            this.showImportOptions = false;

            switch(val) {
                case 'create':
                    this.onTableBuilderChange();
                    break;

                case 'pre':
                    this.onDataTableSelectChange(this.dataTableSelectValue);
                    break;

                default:
                    this.selectedValue = null;
                    this.emitInput();
            }
        },

        onClickImportData() {
            this.showImportOptions = true;
        },

        async onImportSelectChange(val) {
            // fetch the data for <table-builder-view>
            const results = await this.fetchDataTable(val);
            this.tableBuilderData = isObject(results) ? results.table_data : null;
            this.onTableBuilderChange();
            // this.showImportOptions = false;
        }
    }
};
</script>


<template>
    <div>
        <b-form-select
            v-model="action"
            :options="actionSelectOptions"
            class="widthAuto"
            @input="onActionSelectChange"></b-form-select>

        <template v-if="action === 'pre'">
            <icon-arrow-right
                :stroke-width="2" />

            <data-table-select
                v-model="dataTableSelectValue"
                class="width150"
                @input="onDataTableSelectChange" />

            <div class="ptxl" v-if="dataTableSelectValue">
                <app-overlay :show="loading">
                    <table-builder-view :table-data="readOnlyTableData" />
                </app-overlay>
            </div>
        </template>

        <div class="ptxl" v-if="action === 'create'">
            <app-overlay :show="loading">
                <table-builder
                    v-model="tableBuilderData"
                    @input="onTableBuilderChange"
                    :show-import="true">
                </table-builder>
            </app-overlay>
        </div>
    </div>
</template>
