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
        <line x1="9" y1="3" x2="9" y2="15" />
        <line x1="3" y1="7" x2="14" y2="7" />
        <line x1="3" y1="11" x2="14" y2="11" />
        <polyline points="14 15 3 15 3 3 14 3" />
        <rect x="13.5" y="13.5" width="11" height="4" transform="translate(34.5 -3.5) rotate(90)" />
        <polyline points="21 6 19 4 17 6" />
        <line x1="19" y1="8" x2="19" y2="4" />
    </icon-base>
</template>



