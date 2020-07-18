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
        v-bind="$attrs"
        pill>{{ label }}</b-badge>
</template>


<style lang="scss">
.badge {
    padding: 0.35em 0.6em !important;
}
.badge-success {
    background-color: #def7ec !important;
    color: #03543f !important;
}
.badge-danger {
    background-color: #fde8e8 !important;
    color: #9b1c1c !important;
}
</style>
