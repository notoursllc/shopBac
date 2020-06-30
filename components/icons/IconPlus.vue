<script>
import IconBase from '@/components/icons/IconBase';

export default {
    components: {
        IconBase
    },

    inheritAttrs: false
};
</script>

<template>
    <icon-base v-bind="$attrs">
        <line x1="12" y1="5.04" x2="12" y2="19.02" />
        <line x1="18.99" y1="12.03" x2="5.01" y2="12.03" />
    </icon-base>
</template>
