<script>
import tax_mixin from '@/mixins/tax_mixin';

export default {
    components: {
        Fab: () => import('@/components/Fab')
    },

    mixins: [
        tax_mixin
    ],

    data() {
        return {
            showShippoWarning: false,
            modalIsActive: false,
            tax: {}
        };
    },

    methods: {
        async getTax(id) {
            if(!id) {
                return;
            }

            try {
                this.tax = await this.$api.taxes.get(id);

                if(!this.tax) {
                    throw new Error(this.$t('Tax not found'));
                }
            }
            catch(e) {
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
            }
        },

        async onUpsert() {
            try {
                const tax = await this.$api.taxes[this.tax.id ? 'update' : 'add'](this.tax);

                if(!tax) {
                    throw new Error('Update error');
                }

                const title = this.tax.id ? 'Updated successfully' : 'Added successfully';
                this.$successMessage(`${title}: ${tax.name}`);
                this.taxmix_goToList();
            }
            catch(e) {
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
            }
        },

        onCancel() {
            this.taxmix_goToList();
        }
    },

    created() {
        this.getTax(this.$route.params.id);
    }
};
</script>


<template>
    <div>
        <div class="formContainer">
            <!-- name -->
            <div class="formRow">
                <label>Name:</label>
                <span>
                    <el-input v-model="tax.name" />
                </span>
            </div>

            <!-- percentage -->
            <div class="formRow">
                <label>Percentage:</label>
                <span>
                    <el-input-number
                        v-model="tax.percentage"
                        controls-position="right"
                        :step=".01" />
                </span>
            </div>

            <!-- percentage -->
            <div class="formRow">
                <label></label>
                <span>
                    <div class="mtl">
                        <el-button
                            type="primary"
                            @click="onUpsert">SAVE</el-button>

                        <el-button
                            @click="onCancel">CANCEL</el-button>
                    </div>
                </span>
            </div>
        </div>
    </div>
</template>


<style lang="scss">
@import "~assets/css/components/_formRow.scss";
</style>
