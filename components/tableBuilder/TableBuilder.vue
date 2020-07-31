<script>
import isObject from 'lodash.isobject';


export default {
    components: {
        draggable: () => import('vuedraggable'),
        IconDragHandle: () => import('@/components/icons/IconDragHandle'),
        IconTrashCan: () => import('@/components/icons/IconTrashCan'),
        IconArrowRight: () => import('@/components/icons/IconArrowRight'),
        IconArrowLeft: () => import('@/components/icons/IconArrowLeft'),
        IconArrowDown: () => import('@/components/icons/IconArrowDown'),
        IconPlus: () => import('@/components/icons/IconPlus'),
        IconImport: () => import('@/components/icons/IconImport'),
        IconWarningOutine: () => import('@/components/icons/IconWarningOutline'),
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
                                @onConfirm="doDataImport();">
                                <div class="tac">
                                    {{ $t('Import data from an existing Data Table') }}:

                                    <div class="pts pbm">
                                        <data-table-select
                                            v-model="importFromDataTableId"
                                            class="width150"
                                            size="sm" />
                                    </div>

                                    <app-message>
                                        <template v-slot:icon>
                                            <icon-warning-outine />
                                        </template>
                                        {{ $t('This action will override existing table data.') }}
                                    </app-message>
                                </div>

                                <b-button
                                    slot="reference"
                                    variant="outline-secondary"
                                    size="sm"
                                    v-b-tooltip.hover.top="$t('Import data from an existing Data Table')"
                                    class="border-dashed-2">
                                    <icon-import :width="20" :height="20" />
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
                                        <icon-trash-can /><icon-arrow-down :stroke-width="2" />
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
                                        <icon-arrow-left
                                            :stroke-width="2" />
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
                                        <icon-arrow-right :stroke-width="2" />
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
                                <icon-plus
                                    :stroke-width="2"
                                    :width="16"
                                    :height="16" /> {{ $t('column') }}
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
                                <icon-drag-handle />
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
                                    <icon-arrow-left :stroke-width="2" /><icon-trash-can />
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
                            <icon-plus
                                :stroke-width="2"
                                :width="16"
                                :height="16" /> {{ $t('row') }}
                        </b-button>

                        <pop-confirm @onConfirm="clearTable()">
                            <app-message>
                                <template v-slot:icon>
                                    <icon-warning-outine />
                                </template>
                                {{ $t('Are you sure you want to remove all data from this table?') }}
                            </app-message>

                            <b-button
                                slot="reference"
                                variant="outline-secondary"
                                size="sm"
                                class="ml-3 border-dashed-2">
                                <icon-trash-can /> {{ $t('Clear table') }}
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
