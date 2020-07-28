<script>
import isObject from 'lodash.isobject';

export default {
    name: 'SpecTableWizard',

    components: {
        TableBuilder: () => import('@/components/tableBuilder/TableBuilder'),
        TableBuilderView: () => import('@/components/tableBuilder/TableBuilderView'),
        SpecTableSelect: () => import('@/components/product/SpecTableSelect'),
        IconArrowRight: () => import('@/components/icons/IconArrowRight'),
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
            action: null,
            wizardSelectOptions: [
                { text: this.$t('None'), value: null },
                { text: this.$t('Use pre-defined'), value: 'pre' },
                { text: this.$t('Create new'), value: 'create' },
                { text: this.$t('Create from pre-defined'), value: 'copy' }
            ],
            selectedSpecTable: null,
            pre: {
                selectedSpecTable: null,
                data: null
            },
            create: {
                data: null
            },
            copy: {
                selectedSpecTable: null,
                data: null
            }
        };
    },

    watch: {
        init: {
            handler(newVal) {
                this.action = isObject(newVal) ? 'create' : 'pre';
                this[this.action].data = newVal;
            },
            immediate: true
        }
    },

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
                    throw new Error(this.$t('Spec Table not found'));
                }
            }
            catch(e) {
                this.$errorToast(e.message);
            }

            this.loading = false;
            return tableData;
        },

        async onSpecTableSelectChange(val) {
            if(this.action === 'pre' || this.action === 'copy') {
                const results = await this.fetchSpecTable(val);
                this[this.action].data = isObject(results) ? results.table_data : null;
                this.emitInput();
            }
        },

        emitInput() {
            switch(this.action) {
                case 'pre':
                    this.$emit('input', this.pre.selectedSpecTable);
                    break;

                case 'create':
                case 'copy':
                    this.$emit('input', this[this.action].data);
                    break;

                default:
                    this.$emit('input', null);
            }
        },

        onWizardSelectOptionsChange(val) {
            this.emitInput();
        },

        onTableBuilderChange(val) {
            this.emitInput();
        }
    }
};
</script>


<template>
    <div>
        <div>
            <b-form-select
                v-model="action"
                :options="wizardSelectOptions"
                class="widthAuto"
                @input="onWizardSelectOptionsChange"></b-form-select>

            <template v-if="action === 'pre' || action === 'copy'">
                <icon-arrow-right
                    :stroke-width="2" />
            </template>

            <spec-table-select
                v-if="action === 'pre'"
                v-model="pre.selectedSpecTable"
                class="width150"
                @input="onSpecTableSelectChange" />

            <spec-table-select
                v-if="action === 'copy'"
                v-model="copy.selectedSpecTable"
                class="width150"
                @input="onSpecTableSelectChange" />
        </div>

        <div class="ptl">
            <app-overlay :show="loading">
                <template v-if="action === 'pre'">
                    in pre {{ pre.data }}
                    <template v-if="pre.data">
                        <table-builder-view :table-data="pre.data" />
                    </template>
                </template>

                <template v-if="action === 'create'">
                    <table-builder
                        v-model="create.data"
                        @input="onTableBuilderChange" />
                </template>

                <template v-if="action === 'copy'">
                    in copy
                    <!-- <template v-if="copy.data"> -->
                        <div class="pbs">
                            <b-button
                                variant="light"
                                size="sm">Import data</b-button>
                        </div>
                        <table-builder
                            v-model="copy.data"
                            @input="onTableBuilderChange" />
                    <!-- </template> -->
                </template>
            </app-overlay>
        </div>
    </div>
</template>
