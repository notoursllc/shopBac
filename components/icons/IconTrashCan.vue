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
        <line x1="3.01" y1="6.44" x2="21.01" y2="6.44" />
        <polyline points="5 7 5 21 19 21 19 7" />
        <polyline points="9 6 9 3 15 3 15 6" />
        <line x1="10" y1="10" x2="10" y2="17" />
        <line x1="14" y1="10" x2="14" y2="17" />
    </icon-base>
</template>



