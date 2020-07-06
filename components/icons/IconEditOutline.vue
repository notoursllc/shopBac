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
        <polyline points="12 3 3 3 3 21 21 21 21 12" />
        <path d="M19,3,9,13,8,16l3-1L21,5A2,2,0,0,0,19,3Z" />
    </icon-base>
</template>



