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
        PopConfirm: () => import('@/components/PopConfirm')
    },

    props: {
        value: {
            type: Object,
            default: function() {
                return {};
            }
        }
    },

    data: function() {
        return {
            tableData: {
                columns: [],
                rows: []
            }
        };
    },

    computed: {
        canShowRowGrabHandles() {
            return Array.isArray(this.tableData.rows) && this.tableData.rows.length > 1;
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

            if(!this.tableData.rows.length) {
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
            if(!this.tableData.columns.length) {
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

        init() {
            if(!this.tableData.columns.length) {
                this.addColumn();
            }

            if(!this.tableData.rows.length) {
                this.addRow();
            }

            this.emitInput();
        }
    }
};
</script>


<template>
    <div>
        <b-table-simple
            hover
            responsive
            table-class="table-builder-table">
            <b-thead>
                <b-tr>
                    <b-th class="vabtm width50 no-color"></b-th>
                    <b-th class="th"></b-th>
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
                                    size="sm">
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
                    <b-th class="no-color">
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
                    <b-th class="no-color"></b-th>
                </b-tr>
            </b-thead>

            <draggable
                v-model="tableData.rows"
                handle=".handle"
                ghost-class="ghost"
                tag="b-tbody">
                <b-tr v-for="(row, idx) in tableData.rows" :key="idx">
                    <!-- drag handle -->
                    <b-td class="no-color">
                        <i class="handle cursorGrab" v-show="canShowRowGrabHandles">
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
                    <b-td class="no-color">
                        <pop-confirm @onConfirm="deleteRow(idx)">
                            {{ $t('Delete this row?') }}

                            <b-button
                                slot="reference"
                                variant="outline-secondary"
                                size="sm">
                                <icon-arrow-left :stroke-width="2" /><icon-trash-can />
                            </b-button>
                        </pop-confirm>
                    </b-td>
                </b-tr>
            </draggable>

            <b-tr>
                <b-td class="no-color"></b-td>

                <!-- add row button -->
                <b-td class="no-color">
                    <b-button
                        @click="addRow"
                        variant="outline-secondary"
                        size="sm">
                        <icon-plus
                            :stroke-width="2"
                            :width="16"
                            :height="16" /> {{ $t('row') }}
                    </b-button>
                </b-td>

                <b-td class="no-color" :colspan="tableData.columns.length"></b-td>
            </b-tr>
        </b-table-simple>
    </div>
</template>

<style lang="scss">
.header-input-btn {
    padding: 2px 1px !important;
    cursor: pointer;
}

.col-icon-container {
    text-align: center;
    margin-bottom: 5px;
}

.table-builder-footer {
    padding-top: 40px;
    text-align: left;
}

$borderColor: #e0e1e2;

.table.table-builder-table {
    // border: 1px solid $borderColor;
    border: 0;
    width: auto !important;

    th, td {
        border: 1px solid #cdcbcb;
    }

    thead th {
        padding: 0.4rem;
        font-weight: 400;
        border-bottom: 0;
        color: #757575;
    }
    .th {
        background-color: #f0f0f0;

        input {
            color: #000;
            font-weight: 500;
        }
    }

    tr:hover {
        background-color: #f0f9ed;
    }

    .no-color {
        background-color: #fff !important;
        border: 0;
    }

    .header-button {
        padding: 5px 0 20px 0;
    }
    .footer-button {
        padding: 20px 0 5px 0;
    }
}
</style>
