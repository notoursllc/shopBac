<script>
export default {
    components: {
        MasterTypesManager: () => import('@/components/MasterTypesManager')
    }
}
</script>


<template>
    <master-types-manager object="product_type" />
</template>
