<script>
import { getNextAvailableTypeValue } from '@/utils/common';

export default {
    components: {
        TextCard: () => import('@/components/TextCard')
    },

    data() {
        return {
            collection: {},
            domainName: process.env.DOMAIN_NAME
        };
    },

    async mounted() {
        if(this.$route.params.id) {
            this.fetchCollection(this.$route.params.id);
        }
        else {
            await this.setNextAvailableValue();
        }
    },

    methods: {
        goToProductCollectionList() {
            this.$router.push({
                name: 'product-collections'
            });
        },

        async fetchCollection(id) {
            try {
                this.collection = await this.$api.productCollections.get(id);

                if(!this.collection) {
                    throw new Error(this.$t('Collection not found'));
                }
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        async setNextAvailableValue() {
            try {
                const collections = await this.$api.productCollections.list();
                this.collection.value = getNextAvailableTypeValue(collections);
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        async onFormSave() {
            try {
                const collection = await this.$api.productCollections.upsert(this.collection);

                if(!collection) {
                    throw new Error(this.$t('Error updating Collection'));
                }

                const title = collection.id ? this.$t('Collection updated successfully') : this.$t('Collection added successfully');
                this.$successToast(`${title}: ${collection.name}`);
                this.goToProductCollectionList();

            }
            catch(e) {
                this.$errorToast(e.message);
            }
        }
    }
};
</script>


<template>
    <div>
        <text-card class="mbl">
            <div slot="header">{{ $t('General Info') }}</div>

            <!-- Available -->
            <div class="inputRow">
                <span>
                    <b-form-checkbox
                        v-model="collection.published">{{ $t('Published') }}</b-form-checkbox>
                </span>
            </div>

            <!-- Name -->
            <div class="inputRow">
                <label>{{ $t('Name') }}:</label>
                <span>
                    <b-form-input
                        v-model="collection.name" />
                </span>
            </div>

            <!-- Description -->
            <div class="inputRow">
                <label>{{ $t('Description') }}:</label>
                <span>
                    <b-form-textarea
                        v-model="collection.description"
                        rows="2"></b-form-textarea>
                </span>
            </div>

            <!-- Value -->
            <div class="inputRow">
                <label>{{ $t('Value') }}:</label>
                <span> {{ collection.value }}</span>
            </div>
        </text-card>

        <!-- SEO -->
        <text-card>
            <div slot="header">{{ $t('Search engine listing') }}</div>

            <!-- page title -->
            <div class="inputRow">
                <label>{{ $t('Page title') }}:</label>
                <span>
                    <b-form-input
                        v-model="collection.seo_page_title" />
                </span>
            </div>

            <!-- description -->
            <div class="inputRow">
                <label>{{ $t('Description') }}:</label>
                <span>
                    <b-form-textarea
                        v-model="collection.seo_page_desc"
                        rows="2"></b-form-textarea>
                </span>
            </div>

            <!-- URI -->
            <div class="inputRow">
                <label>{{ $t('URL and handle') }}:</label>
                <span>
                    <b-input-group :prepend="`https://${domainName}`">
                        <b-form-input
                            v-model="collection.seo_uri"
                            maxlength="50" />
                    </b-input-group>
                </span>
            </div>
        </text-card>

        <!-- buttons -->
        <div class="ptl">
            <b-button
                variant="primary"
                @click="onFormSave"
                class="mrm">{{ $t('Save') }}</b-button>

            <b-button
                variant="light"
                @click="goToProductCollectionList">{{ $t('Cancel') }}</b-button>
        </div>
    </div>
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
