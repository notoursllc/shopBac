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
        <rect x="10" y="17" width="11" height="4" />
        <polyline points="6 17 4 19 6 21" />
        <line x1="8" y1="19" x2="4" y2="19" />
        <polyline points="3 14 3 3 15 3 15 14" />
        <line x1="9" y1="14" x2="9" y2="3" />
        <line x1="3" y1="7" x2="15" y2="7" />
        <line x1="3" y1="11" x2="15" y2="11" />
    </icon-base>
</template>



