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
        <polyline points="3 10 3 21 21 21 21 10" />
        <line x1="12.04" y1="15" x2="12" y2="3" />
        <line x1="12.04" y1="15" x2="15.98" y2="11.04" />
        <line x1="11.96" y1="15" x2="8.02" y2="11.04" />
    </icon-base>
</template>
