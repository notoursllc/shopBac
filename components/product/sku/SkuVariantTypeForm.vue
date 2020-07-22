<script>
export default {
    components: {
        MetaDataBuilder: () => import('@/components/MetaDataBuilder')
    },

    props: {
        id: {
            type: String,
            default: null
        }
    },

    data() {
        return {
            type: {}
        };
    },

    watch: {
        id: {
            handler(newVal) {
                if(newVal) {
                    this.fetchType();
                }
            },
            immediate: true
        }
    },

    methods: {
        async fetchType() {
            try {
                this.type = await this.$api.productSkuVariantTypes.get(this.id);
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        async onFormSave() {
            try {
                const mt = await this.$api.productSkuVariantTypes.upsert(this.type);

                if(!mt) {
                    throw new Error(this.$t('Error updating item'));
                }

                const title = this.id ? this.$t('Item updated successfully') : this.$t('Item added successfully');
                this.$successToast(`${title}: ${mt.name}`);
                this.$emit('success');
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        }
    }
};
</script>


<template>
    <form>
        <!-- Name -->
        <div class="formRow">
            <label>{{ $t('Label') }}:</label>
            <span>
                <b-form-input
                    v-model="type.label" />
            </span>
        </div>

        <!-- Description -->
        <div class="formRow">
            <label>{{ $t('Description') }}:</label>
            <span>
                <b-form-textarea
                    v-model="type.description"
                    :rows="2" />
            </span>
        </div>

        <!-- Meta data -->
        <div class="formRow">
            <label>{{ $t('Options') }}:</label>
            <span>
                <div class="mtm">
                    <meta-data-builder
                        v-model="type.optionData"
                        :property-placeholder="$t('Label')" />
                </div>
            </span>
        </div>

        <!-- buttons -->
        <div class="formRow">
            <label></label>
            <span class="ptl">
                <b-button
                    variant="primary"
                    @click="onFormSave">{{ $t('Save') }}</b-button>
            </span>
        </div>
    </form>
</template>

<style lang="scss">
    @import "~assets/css/components/_table.scss";
    @import "~assets/css/components/_formRow.scss";

    .formContainer {
        width: 500px;

        .formRow > label {
            white-space: nowrap;
        }

        .formRow > span {
            width: 100%;
        }
    }
</style>
