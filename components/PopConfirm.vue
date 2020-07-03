<script>
export default {
    inheritAttrs: false,

    props: {
        target: {
            type: String,
            required: true
        },
        confirmButtonText: {
            type: String,
            default: ''
        },
        cancelButtonText: {
            type: String,
            default: ''
        }
    },

    computed: {
        confirmLabel() {
            return this.confirmButtonText || this.$t('OK');
        },
        cancelLabel() {
            return this.cancelButtonText || this.$t('cancel');
        }
    },

    methods: {
        onConfirmClick(e) {
            this.$emit('onConfirm', e);
        },

        onCancelClick(e) {
            this.$emit('onCancel', e);
        }
    }
};
</script>


<template>
    <b-popover
        :target="target"
        v-bind="$attrs"
        v-on="$listeners">
        <slot></slot>

        <div class="ptm tar">
            <b-button
                variant="link"
                size="sm"
                @click="onCancelClick">{{ cancelLabel }}</b-button>

            <b-button
                variant="primary"
                size="sm"
                @click="onConfirmClick">{{ confirmLabel }}</b-button>
        </div>
    </b-popover>
</template>
