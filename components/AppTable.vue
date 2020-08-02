<script>
// https://gist.github.com/Loilo/73c55ed04917ecf5d682ec70a2a1b8e2

export default {
    inheritAttrs: false,

    methods: {
        // emitting a convenience event with just the sort params
        sortChanged(val) {
            this.$emit('column-sort', {
                sortBy: val.sortBy,
                sortDesc: val.sortDesc
            });
        }
    }
};
</script>


<template>
    <b-table
        v-on="$listeners"
        v-bind="$attrs"
        @sort-changed="sortChanged"
        sort-icon-left
        responsive="md"
        no-local-sorting
        show-empty
        table-class="bread-table">
        <template v-for="(_, name) in $scopedSlots" :slot="name" slot-scope="slotData">
            <slot :name="name" v-bind="slotData" />
        </template>

        <template v-slot:empty>
            <div class="tac">{{ $t('No data') }}</div>
        </template>
    </b-table>
</template>
