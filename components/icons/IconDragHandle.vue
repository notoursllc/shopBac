<script>
import IconBase from '@/components/icons/IconBase';

export default {
    components: {
        IconBase
    },

    inheritAttrs: false,

    computed: {
        fill() {
            return this.$attrs.fill || '#5d6674';
        }
    }
};
</script>

<template>
    <icon-base v-bind="$attrs">
        <g :fill="fill" stroke="none" stroke-width="0">
            <circle cx="9" cy="4.99" r="1.98" />
            <circle cx="8.99" cy="12" r="1.98" />
            <circle cx="8.98" cy="18.99" r="1.98" />
            <circle cx="15.01" cy="4.97" r="1.98" />
            <circle cx="14.99" cy="11.98" r="1.98" />
            <circle cx="14.98" cy="18.97" r="1.98" />
        </g>
    </icon-base>
</template>
