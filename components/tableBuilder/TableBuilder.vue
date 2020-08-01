<script>
import isObject from 'lodash.isobject';

export default {
    components: {
        draggable: () => import('vuedraggable'),
        PopConfirm: () => import('@/components/PopConfirm'),
        DataTableSelect: () => import('@/components/product/dataTable/DataTableSelect'),
        AppOverlay: () => import('@/components/AppOverlay'),
        AppMessage: () => import('@/components/AppMessage')
    },

    props: {
        value: {
            type: Object,
            default: function() {
                return {};
            }
        },

        showImport: {
            type: Boolean,
            default: false
        }
    },

    data: function() {
        return {
            tableData: {
                columns: [],
                rows: []
            },
            importFromDataTableId: null,
            canDoImport: false,
            loading: false
        };
    },

    computed: {
        canShowRowGrabHandles() {
            return Array.isArray(this.tableData.rows) && this.tableData.rows.length > 1;
        },

        numColumns() {
            return Array.isArray(this.tableData.columns) ? this.tableData.columns.length : 0;
        },

        numRows() {
            return Array.isArray(this.tableData.rows) ? this.tableData.rows.length : 0;
        }
    },

    watch: {
        value: {
            handler(newVal) {
                if(isObject(newVal) && Object.keys(newVal).length) {
                    this.tableData = newVal;
                }
                else {
                    this.init();
                }
            },
            immediate: true
        }
    },

    created() {
        this.setCanDoImport();
    },

    methods: {
        emitInput() {
            this.$emit(
                'input',
                this.tableData
            );
        },

        canShowLeftIcon(index) {
            return this.tableData.columns[index - 1];
        },

        canShowRightIcon(index) {
            return this.tableData.columns[index + 1];
        },

        onColumnMove(index, moveLeft) {
            const new_index = moveLeft ? index - 1 : index + 1;

            const removedCols = this.tableData.columns.splice(index, 1);
            this.tableData.columns.splice(new_index, 0, removedCols[0]);

            this.tableData.rows.forEach((row) => {
                const removed = row.cells.splice(index, 1);
                row.cells.splice(new_index, 0, removed[0]);
            });

            this.emitInput();
        },

        pushNewColumn(label) {
            this.tableData.columns.push(
                { label: label || null }
            );
        },

        addColumn() {
            this.pushNewColumn();

            if(!this.numRows) {
                this.addRow();
            }
            else {
                // push a new value on to each row
                this.tableData.rows.forEach((row) => {
                    row.cells.push({ value: null });
                });
            }

            this.emitInput();
        },

        addRow() {
            if(!this.numColumns) {
                this.addColumn();
            }
            else {
                const row = {
                    label: null,
                    cells: []
                };

                this.tableData.columns.forEach((obj) => {
                    row.cells.push(
                        { value: null }
                    );
                });

                this.tableData.rows.push(row);
            }

            this.emitInput();
        },

        deleteRow(index) {
            this.tableData.rows.splice(index, 1);
            this.init();
        },

        deleteColumn(index) {
            this.tableData.columns.splice(index, 1);

            this.tableData.rows.forEach((row) => {
                row.cells.splice(index, 1);
            });

            // if all columns have been removed then remove all rows too
            // if(!this.tableData.columns.length) {
            //     let i = this.tableData.rows.length;

            //     while (i--) {
            //         this.tableData.rows.splice(i, 1);
            //     }
            // }

            this.init();
        },

        onInputChange(val) {
            this.emitInput();
        },

        async doDataImport() {
            await this.fetchDataTable(this.importFromDataTableId);
            this.emitInput();
        },

        clearTable() {
            this.tableData.columns = [];
            this.tableData.rows = [];
            this.init();
        },

        async fetchDataTable(id) {
            if(!id) {
                return;
            }

            this.loading = true;

            try {
                const data = await this.$api.productDataTables.get(id);

                if(!data) {
                    throw new Error(this.$t('Data Table not found'));
                }

                this.tableData = data.table_data;
            }
            catch(e) {
                this.$errorToast(e.message);
            }

            this.loading = false;
        },

        async setCanDoImport() {
            try {
                const results = await this.$api.productDataTables.list({
                    limit: 1
                });

                this.canDoImport = results.length;
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        init() {
            if(!this.numColumns) {
                this.addColumn();
            }

            if(!this.numRows) {
                this.addRow();
            }

            this.emitInput();
        }
    }
};
</script>


<template>
    <div>
        <app-overlay :show="loading">
            <b-table-simple
                hover
                responsive
                table-class="table-builder-table">
                <b-thead>
                    <b-tr>
                        <b-th class="grab-handle-cell no-color" v-show="canShowRowGrabHandles"></b-th>
                        <b-th class="th vat">
                            <!-- import button -->
                            <pop-confirm
                                v-if="showImport"
                                :confirm-button-label="$t('Import')"
                                :show-confirm-button="!!canDoImport"
                                :cancel-button-label="!canDoImport ? $t('OK') : ''"
                                @onConfirm="doDataImport();">
                                <div>
                                    <template v-if="canDoImport">
                                        <b-form-group
                                            id="fieldset-1"
                                            :label="$t('Import data from an existing Data Table') + ':'"
                                            label-for="select_data_table">
                                            <data-table-select
                                                v-model="importFromDataTableId"
                                                id="select_data_table"
                                                size="sm" />
                                        </b-form-group>

                                        <app-message>
                                            <template v-slot:icon>
                                                <svg-icon icon="alert-circle" variant="warning" />
                                            </template>
                                            {{ $t('This action will override existing table data.') }}
                                        </app-message>
                                    </template>

                                    <template v-else>
                                        {{ $t("There aren't any pre-defined data tables to import from.") }}
                                    </template>
                                </div>

                                <b-button
                                    slot="reference"
                                    variant="outline-secondary"
                                    size="sm"
                                    v-b-tooltip.hover.top="$t('Import data from an existing Data Table')"
                                    class="border-dashed-2">
                                    <svg-icon icon="import" stroke-width="1px" width="18" height="18" />
                                </b-button>
                            </pop-confirm>
                        </b-th>

                        <b-th
                            v-for="(obj, index) in tableData.columns"
                            :key="index"
                            class="th">
                            <div class="col-icon-container">
                                <pop-confirm @onConfirm="deleteColumn(index);">
                                    {{ $t('Delete this column?') }}

                                    <b-button
                                        slot="reference"
                                        variant="outline-secondary"
                                        size="sm"
                                        class="border-dashed-2">
                                        <svg-icon icon="trash" stroke-width="1px" /><svg-icon icon="arrow-down" />
                                    </b-button>
                                </pop-confirm>
                            </div>

                            <b-input-group size="sm">
                                <template
                                    v-if="canShowLeftIcon(index)"
                                    v-slot:prepend>
                                    <b-input-group-text
                                        class="header-input-btn"
                                        @click="onColumnMove(index, true)">
                                        <svg-icon icon="arrow-left" />
                                    </b-input-group-text>
                                </template>

                                <b-form-input
                                    v-model="tableData.columns[index].label"
                                    :placeholder="$t('Column label')"
                                    size="sm"
                                    @input="onInputChange"></b-form-input>

                                <template
                                    v-if="canShowRightIcon(index)"
                                    v-slot:append>
                                    <b-input-group-text
                                        class="header-input-btn"
                                        @click="onColumnMove(index, false)">
                                        <svg-icon icon="arrow-right" />
                                    </b-input-group-text>
                                </template>
                            </b-input-group>
                        </b-th>

                        <!-- add column button -->
                        <b-th class="no-color empty-column-cell">
                            <b-button
                                @click="addColumn"
                                variant="outline-secondary"
                                size="sm">
                                <svg-icon icon="plus" width="16" height="16" /> {{ $t('column') }}
                            </b-button>
                        </b-th>
                    </b-tr>
                </b-thead>

                <draggable
                    v-model="tableData.rows"
                    handle=".handle"
                    ghost-class="ghost"
                    tag="b-tbody">
                    <b-tr v-for="(row, idx) in tableData.rows" :key="idx">
                        <!-- drag handle -->
                        <b-td class="no-color grab-handle-cell" v-show="canShowRowGrabHandles">
                            <i class="handle cursorGrab">
                                <svg-icon icon="dots-vertical-double" />
                            </i>
                        </b-td>

                        <!-- row label -->
                        <b-td class="th">
                            <b-form-input
                                v-model="row.label"
                                size="sm"
                                :placeholder="$t('Row label')"
                                @input="onInputChange"></b-form-input>
                        </b-td>

                        <!-- row inputs -->
                        <b-td v-for="obj in row.cells" :key="obj.columnId">
                            <b-form-input
                                v-model="obj.value"
                                size="sm"
                                @input="onInputChange"></b-form-input>
                        </b-td>

                        <!-- delete button -->
                        <b-td class="no-color empty-column-cell">
                            <pop-confirm @onConfirm="deleteRow(idx)">
                                {{ $t('Delete this row?') }}

                                <b-button
                                    slot="reference"
                                    variant="outline-secondary"
                                    size="sm"
                                    class="border-dashed-2">
                                    <svg-icon icon="arrow-left" /><svg-icon icon="trash" stroke-width="1px" />
                                </b-button>
                            </pop-confirm>
                        </b-td>
                    </b-tr>
                </draggable>

                <b-tr>
                    <b-td class="no-color" v-show="canShowRowGrabHandles"></b-td>

                    <!-- add row button -->
                    <b-td class="no-color empthy-row-cell" :colspan="numColumns + 1">
                        <b-button
                            @click="addRow"
                            variant="outline-secondary"
                            size="sm">
                            <svg-icon icon="plus" width="16" height="16" /> {{ $t('row') }}
                        </b-button>

                        <pop-confirm @onConfirm="clearTable()">
                            <app-message>
                                <svg-icon v-slot:icon icon="alert-circle" />
                                {{ $t('Are you sure you want to remove all data from this table?') }}
                            </app-message>

                            <b-button
                                slot="reference"
                                variant="outline-secondary"
                                size="sm"
                                class="ml-3 border-dashed-2">
                                <svg-icon icon="trash" stroke-width="1px" width="18" height="18" /> {{ $t('Clear table') }}
                            </b-button>
                        </pop-confirm>
                    </b-td>

                    <b-td class="no-color"></b-td>
                </b-tr>
            </b-table-simple>
        </app-overlay>
    </div>
</template>

<style lang="scss">
@import "~assets/css/components/_tableBuilderComponent.scss";
</style>
