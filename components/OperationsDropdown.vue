<script>
export default {
    name: 'OperationsDropdown',

    props: {
        showView: {
            type: Boolean,
            default: true
        },

        showEdit: {
            type: Boolean,
            default: true
        },

        showDelete: {
            type: Boolean,
            default: true
        }
    }
};
</script>

<template>
    <b-dropdown
        variant="outline-secondary"
        size="sm"
        toggle-class="bv-ops-dropdown">
        <b-dropdown-item-button v-if="showView" @click="$emit('view')">{{ $t('View') }}</b-dropdown-item-button>
        <b-dropdown-item-button v-if="showEdit" @click="$emit('edit')">{{ $t('Edit') }}</b-dropdown-item-button>
        <b-dropdown-item-button v-if="showDelete" @click="$emit('delete')">{{ $t('Delete') }}</b-dropdown-item-button>
    </b-dropdown>
</template>

<style lang="scss">
.bv-ops-dropdown {
    padding: 1px 7px !important;
}
</style>
