<script>
import uuid from 'uuid';

export default {
    components: {
        draggable: () => import('vuedraggable'),
        IconDragHandle: () => import('@/components/icons/IconDragHandle'),
        IconTrashCan: () => import('@/components/icons/IconTrashCan'),
        IconPlus: () => import('@/components/icons/IconPlus'),
        IconArrowRight: () => import('@/components/icons/IconArrowRight'),
        IconArrowLeft: () => import('@/components/icons/IconArrowLeft'),
        IconAddTableRow: () => import('@/components/icons/IconAddTableRow'),
        IconAddTableColumn: () => import('@/components/icons/IconAddTableColumn'),
        PopConfirm: () => import('@/components/PopConfirm')
    },

    props: {
        value: {
            type: Array,
            default: function() {
                return [];
            }
        },

        propertyPlaceholder: {
            type: String,
            default: null
        },

        valuePlaceholder: {
            type: String,
            default: function() {
                return this.$t('Value');
            }
        },

        isSortable: {
            type: Boolean,
            default: true
        }
    },

    data: function() {
        return {
            columns: [],
            rows: [],



            newdata: []
        };
    },

    computed: {
        // canSortRows() {
        //     return this.isSortable && this.newdata.length > 1;
        // },

        canShowRowGrabHandles() {
            return Array.isArray(this.rows) && this.rows.length > 1;
        }
    },

    // watch: {
    //     value: {
    //         handler(newVal) {
    //             this.newdata = Array.isArray(newVal) ? newVal : [];

    //             if(!this.newdata.length) {
    //                 this.addRow();
    //             }
    //         },
    //         immediate: true
    //     }
    // },

    methods: {
        // emitInput() {
        //     if(!this.newdata.length) {
        //         this.$emit('input', null);
        //         return;
        //     }

        //     this.$emit('input', this.newdata);
        // },

        // onInputChange() {
        //     this.sanitize();
        //     this.emitInput();
        // },

        emitInput() {

        },

        canShowLeftIcon(index) {
            return this.columns[index - 1];
        },

        canShowRightIcon(index) {
            return this.columns[index + 1];
        },

        onColumnMove(index, moveLeft) {
            const new_index = moveLeft ? index - 1 : index + 1;

            const removedCols = this.columns.splice(index, 1);
            this.columns.splice(new_index, 0, removedCols[0]);

            this.rows.forEach((row) => {
                const removed = row.cells.splice(index, 1);
                row.cells.splice(new_index, 0, removed[0]);
            });
        },

        addColumn() {
            this.columns.push(
                { label: null }
            );

            // push a new value on to each row
            this.rows.forEach((row) => {
                row.cells.push({ value: null });
            });
        },

        addRow() {
            const row = {
                label: null,
                cells: []
            };

            this.columns.forEach((obj) => {
                row.cells.push(
                    { value: null }
                );
            });

            this.rows.push(row);
        },

        deleteRow(index) {
            this.rows.splice(index, 1);
            this.init();
        },

        deleteColumn(index) {
            this.columns.splice(index, 1);

            this.rows.forEach((row) => {
                row.cells.splice(index, 1);
            });

            // if all columns have been removed then remove all rows too
            // if(!this.columns.length) {
            //     let i = this.rows.length;

            //     while (i--) {
            //         this.rows.splice(i, 1);
            //     }
            // }

            this.init();
        },

        init() {
            if(!this.columns.length) {
                this.addColumn();
            }

            if(!this.rows.length) {
                this.addRow();
            }
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
                    <b-th class="no-color"></b-th>
                    <b-th :colspan="columns.length + 1" class="tal no-color header-button">
                        <b-button
                            @click="addRow"
                            variant="outline-secondary"
                            size="sm"
                            class="mrm"
                            v-b-tooltip :title="$t('Add row')">
                            <icon-add-table-row
                                :width="30"
                                :height="30" />
                        </b-button>

                        <b-button
                            @click="addColumn"
                            variant="outline-secondary"
                            size="sm"
                            class="mrm"
                            v-b-tooltip :title="$t('Add column')">
                            <icon-add-table-column
                                :width="30"
                                :height="30" />
                        </b-button>
                    </b-th>
                </b-tr>

                <b-tr>
                    <b-th class="vabtm width50 no-color"></b-th>
                    <b-th class="th"></b-th>
                    <b-th
                        v-for="(obj, index) in columns"
                        :key="index"
                        class="th">
                        <div class="col-icon-container">
                            <pop-confirm @onConfirm="deleteColumn(index);">
                                {{ $t('Delete this column?') }}

                                <b-button
                                    slot="reference"
                                    variant="outline-secondary"
                                    size="sm">
                                    <icon-trash-can />
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
                                v-model="columns[index].label"
                                :placeholder="$t('Column label')"
                                size="sm"></b-form-input>

                            <template
                                v-if="canShowRightIcon(index)"
                                v-slot:append>
                                <b-input-group-text
                                    class="header-input-btn"
                                    @click="onColumnMove(index, false)">
                                    <icon-arrow-right
                                        :stroke-width="2" />
                                </b-input-group-text>
                            </template>
                        </b-input-group>
                    </b-th>
                    <b-th class="no-color"></b-th>
                </b-tr>
            </b-thead>

            <draggable
                v-model="rows"
                handle=".handle"
                ghost-class="ghost"
                tag="b-tbody">
                <b-tr v-for="(row, idx) in rows" :key="idx">
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
                            :placeholder="$t('Row label')"></b-form-input>
                    </b-td>

                    <b-td v-for="obj in row.cells" :key="obj.columnId">
                        <b-form-input
                            v-model="obj.value"
                            size="sm"></b-form-input>
                    </b-td>

                    <b-td class="no-color">
                        <pop-confirm @onConfirm="deleteRow(idx)">
                            {{ $t('Delete this row?') }}

                            <b-button
                                slot="reference"
                                variant="outline-secondary"
                                size="sm">
                                <icon-trash-can />
                            </b-button>
                        </pop-confirm>
                    </b-td>
                </b-tr>
            </draggable>
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
    // th {
    //     border: 1px solid $borderColor;
    //     border-bottom: 1px solid #000;
    //     border-right: 1px solid #000;
    //     border-left: 1px solid #000;
    // }
    // td {
    //     // border-top: 1px solid $borderColor;
    //     border: 0;
    // }

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
