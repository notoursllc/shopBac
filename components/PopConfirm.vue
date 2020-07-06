<script>
import uuid from 'uuid';

export default {
    components: {
        Pop: () => import('@/components/Pop')
    },

    inheritAttrs: false,

    props: {
        confirmButtonText: {
            type: String,
            default: ''
        },
        cancelButtonText: {
            type: String,
            default: ''
        }
    },

    data() {
        return {
            uuid: uuid()
        };
    },

    computed: {
        confirmLabel() {
            return this.confirmButtonText || this.$t('OK');
        },

        cancelLabel() {
            return this.cancelButtonText || this.$t('cancel');
        },

        confirmRef() {
            return `btn-confirm-${this.uuid}`;
        },

        cancelRef() {
            return `btn-cancel-${this.uuid}`;
        },

        popoverRef() {
            return `popover-target-${this.uuid}`;
        }
    },

    methods: {
        onConfirmClick(e) {
            this.$emit('onConfirm', e);
            this.hide();
        },

        onCancelClick(e) {
            this.$emit('onCancel', e);
            this.hide();
        },

        focusCancelButton() {
            this.$refs[this.cancelRef].focus();
        },

        hide() {
            this.$refs[this.popoverRef].hide();
        }
    }
};
</script>


<template>
    <pop
        :ref="popoverRef"
        @shown="focusCancelButton"
        v-bind="$attrs"
        v-on="$listeners">
        <slot></slot>

        <div class="ptm tar">
            <b-button
                variant="link"
                size="sm"
                @click="onCancelClick"
                :ref="cancelRef">{{ cancelLabel }}</b-button>

            <b-button
                variant="primary"
                size="sm"
                @click="onConfirmClick"
                :ref="confirmRef">{{ confirmLabel }}</b-button>
        </div>

        <template v-slot:reference>
            <slot name="reference"></slot>
        </template>
    </pop>
</template>
