<script>
import isObject from 'lodash.isobject';

export default {
    name: 'SpecTableWizard',

    components: {
        TableBuilder: () => import('@/components/tableBuilder/TableBuilder'),
        TableBuilderView: () => import('@/components/tableBuilder/TableBuilderView'),
        SpecTableSelect: () => import('@/components/product/SpecTableSelect'),
        IconArrowRight: () => import('@/components/icons/IconArrowRight'),
        IconImport: () => import('@/components/icons/IconImport'),
        AppOverlay: () => import('@/components/AppOverlay')
    },

    inheritAttrs: false,

    props: {
        value: {
            type: [String, Object],
            default: null
        },
        init: {
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
            specTableSelectValue: null,
            action: null,
            readOnlyTableData: null,
            tableBuilderData: null,
            showImportOptions: false
        };
    },

    // watch: {
    //     init: {
    //         handler(newVal) {
    //             this.action = isObject(newVal) ? 'create' : 'pre';
    //             this[this.action].data = newVal;
    //         },
    //         immediate: true
    //     }
    // },

    methods: {
        async fetchSpecTable(id) {
            if(!id) {
                return;
            }

            this.loading = true;
            let tableData;

            try {
                tableData = await this.$api.productSpecTables.get(id);

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

        async onSpecTableSelectChange() {
            this.selectedValue = this.specTableSelectValue;
            this.emitInput();

            // fetch the data for <table-builder-view>
            const results = await this.fetchSpecTable(this.specTableSelectValue);
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
            console.log("ON onActionSelectChange", val)
            this.showImportOptions = false;

            switch(val) {
                case 'create':
                    this.onTableBuilderChange();
                    break;

                case 'pre':
                    this.onSpecTableSelectChange();
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
            const results = await this.fetchSpecTable(val);
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

            <spec-table-select
                v-model="specTableSelectValue"
                class="width150"
                @input="onSpecTableSelectChange" />

            <div class="ptxl" v-if="specTableSelectValue">
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
