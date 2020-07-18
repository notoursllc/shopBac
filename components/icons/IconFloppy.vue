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
        <polygon points="3.01 3.01 20.99 3.01 20.99 20.99 6 21 3 18 3.01 3.01" />
        <polyline points="7 3 7 10 17 10 17 3" />
        <polyline points="8 21 8 16.56 16 16.56 16 21" />
        <line x1="10" y1="18" x2="10" y2="21" />
    </icon-base>
</template>





