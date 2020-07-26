<script>
export default {
    inheritAttrs: false,

    props: {
        value: {},

        size: {
            type: String,
            default: 'md'
        }
    },

    data: function() {
        return {
            selectedVal: null
        };
    },

    computed: {
        sizeClass() {
            switch(this.size) {
                case 'sm':
                case 'lg':
                    return `bv-select-${this.size}`;

                default:
                    return 'bv-select-md';
            }
        }
    },

    watch: {
        value: {
            handler(newVal) {
                this.selectedVal = newVal;
            },
            immediate: true
        }
    },

    methods: {
        emitChange(val) {
            this.$emit('input', val);
        }
    }
};
</script>


<template>
    <v-select
        v-model="selectedVal"
        v-on="$listeners"
        v-bind="$attrs"
        class="bv-select"
        :class="sizeClass"
        @input="emitChange">
        <slot name="no-options">{{ $t('No matching values') }}</slot>
        <slot></slot>
    </v-select>
</template>

<style lang="scss">
.bv-select {
    width: 100%;

    &.bv-select-sm {
        line-height: 1.4;

        .vs__search,
        .vs__search:focus,
        .vs__selected {
            font-size: 0.875rem;
            line-height: 1.4;
        }
    }
    &.bv-select-md {
        line-height: 1.6;

        .vs__search,
        .vs__search:focus,
        .vs__selected {
            font-size: 1rem;
            line-height: 1.6;
        }
    }
    &.bv-select-lg {
        line-height: 1.8;

        .vs__search,
        .vs__search:focus,
        .vs__selected {
            font-size: 1.25rem;
            line-height: 1.8;
        }
    }
}
</style>
