<script>
export default {
    name: 'BooleanTag',

    inheritAttrs: false,

    props: {
        value: {
            type: Boolean
        }
    },

    computed: {
        label() {
            return this.value ? this.$t('Yes') : this.$t('No');
        },

        tagType() {
            return this.value ? 'success' : 'danger';
        }
    }
};
</script>

<template>
    <b-badge
        :variant="tagType"
        v-on="$listeners"
        v-bind="$attrs">{{ label }}</b-badge>
</template>
