<script>
import isObject from 'lodash.isobject';
import cloneDeep from 'lodash.clonedeep';

export default {
    name: 'DataTableWizard',

    components: {
        TableBuilder: () => import('@/components/tableBuilder/TableBuilder'),
        TableBuilderView: () => import('@/components/tableBuilder/TableBuilderView'),
        DataTableSelect: () => import('@/components/product/dataTable/DataTableSelect'),
        AppOverlay: () => import('@/components/AppOverlay'),
        AppMessage: () => import('@/components/AppMessage')
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
            showImportOptions: false,
            allDataTables: []
        };
    },

    computed: {
        canShowPredefinedTables() {
            return this.allDataTables.length;
        },

        visibleActionSelectOptions() {
            const opts = cloneDeep(this.actionSelectOptions);

            if(!this.canShowPredefinedTables) {
                opts.splice(1, 1);
            }

            return opts;
        },

        showWarning() {
            if(!this.dataTableSelectValue) {
                return false;
            }

            let exists = false;

            this.allDataTables.forEach((opt) => {
                if(opt.id === this.dataTableSelectValue) {
                    exists = true;
                }
            });

            return !exists;
        }
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

    created() {
        this.fetchAllDataTables();
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

                // if(!tableData) {
                //     throw new Error(this.$t('Data Table not found'));
                // }
            }
            catch(e) {
                this.$errorToast(e.message);
            }

            this.loading = false;
            return tableData;
        },

        async fetchAllDataTables() {
            try {
                this.allDataTables = await this.$api.productDataTables.all();
            }
            catch(e) {
                this.$errorToast(e.message);
            }
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
        <div class="pb-3" v-if="showWarning">
            <app-message>
                <template v-slot:icon>
                    <svg-icon
                        icon="alert-circle"
                        variant="danger"
                        :width="24"
                        :height="24" />
                </template>
                {{ $t('This SKU is assigned to a Data Table that no longer exists.') }}
            </app-message>
        </div>

        <b-form-select
            v-model="action"
            :options="visibleActionSelectOptions"
            class="widthAuto"
            @input="onActionSelectChange"></b-form-select>

        <template v-if="canShowPredefinedTables && action === 'pre'">
            <svg-icon icon="arrow-right" />

            <data-table-select
                v-model="dataTableSelectValue"
                class="width150"
                @input="onDataTableSelectChange" />

            <div class="pt-4" v-if="dataTableSelectValue">
                <app-overlay :show="loading">
                    <table-builder-view :table-data="readOnlyTableData" />
                </app-overlay>
            </div>
        </template>

        <div class="pt-4" v-if="action === 'create'">
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
