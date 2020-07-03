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
        <line x1="7" y1="12.04" x2="17" y2="12.04" />
        <line x1="7" y1="12.04" x2="10.96" y2="15.98" />
        <line x1="7" y1="11.96" x2="10.96" y2="8.02" />
    </icon-base>
</template>



