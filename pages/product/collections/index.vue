<script>
import isObject from 'lodash.isobject';
import { getNextAvailableTypeValue } from '@/utils/common';

export default {
    components: {
        AppDialog: () => import('@/components/AppDialog'),
        Fab: () => import('@/components/Fab'),
        TextCard: () => import('@/components/TextCard'),
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        BooleanTag: () => import('@/components/BooleanTag')
    },

    data() {
        return {
            showDialog: false,
            collections: [],
            form: {
                name: null,
                value: null
            },
            domainName: process.env.DOMAIN_NAME,
            tableData: {
                headers: [
                    { key: 'name', label: this.$t('Name') },
                    { key: 'published', label: this.$t('Published') }
                ]
            }
        };
    },

    created() {
        this.fetchCollections();
    },

    methods: {
        async fetchCollections() {
            try {
                this.collections = await this.$api.products.listProductCollections();
            }
            catch(e) {
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
            }
        },

        async onDeleteCollection(data) {
            try {
                await this.$confirm(this.$t('delete_name?', {'name': data.name}), this.$t('Please confirm'), {
                    confirmButtonText: this.$t('OK'),
                    cancelButtonText: this.$t('Cancel'),
                    type: 'warning'
                });

                try {
                    const collection = await this.$api.products.deleteProductCollection(data.id);

                    if(!collection) {
                        throw new Error(this.$t('Collection not found'));
                    }

                    this.fetchCollections();
                    this.$successMessage(this.$t('deleted_name', {'name':data.name}));
                    this.resetForm();
                }
                catch(e) {
                    this.$errorMessage(
                        e.message,
                        { closeOthers: true }
                    );
                }
            }
            catch(err) {
                // Do nothing
            }
        },

        async onClickAdd() {
            const collections = await this.$api.products.listProductCollections();
            this.form.published = true;
            this.form.value = getNextAvailableTypeValue(collections);
            this.showDialog = true;
        },


        async onUpsertClick(id) {
            try {
                const collection = await this.$api.products.getProductCollection(id);

                if(!collection) {
                    throw new Error(this.$t('Collection not found'));
                }

                this.form = collection;
                this.showDialog = true;
            }
            catch(e) {
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
            }
        },

        async onFormSave() {
            try {
                const collection = await this.$api.products.upsertProductCollection(this.form);

                if(!collection) {
                    throw new Error(this.$t('Error updating Collection'));
                }

                const title = collection.id ? this.$t('Collection updated successfully') : this.$t('Collection added successfully');
                this.$successMessage(`${title}: ${collection.name}`);

                this.showDialog = false;
                this.fetchCollections();
                this.resetForm();
            }
            catch(e) {
                this.$errorMessage(
                    e.message,
                    { closeOthers: true }
                );
            }
        },

        onFormCancel() {
            this.showDialog = false;
            this.resetForm();
        },

        resetForm() {
            this.form = {
                name: null,
                value: null
            };
        }
    }
};
</script>


<template>
    <div>
        <fab type="add" @click="onClickAdd" />

        <b-table
            :items="collections"
            :fields="tableData.headers"
            borderless
            striped
            hover>

            <!-- title -->
            <template v-slot:cell(name)="row">
                {{ row.item.name }}
                <operations-dropdown
                    :show-view="false"
                    @edit="onUpsertClick(row.item.id)"
                    @delete="onDeleteClick(row.item)" />
            </template>

            <!-- published -->
            <template v-slot:cell(published)="row">
                <boolean-tag :value="row.item.published" />
            </template>
        </b-table>


        <app-dialog
            title="Edit Collection"
            :visible.sync="showDialog"
            width="40%">

            <!-- Available -->
            <div class="inputRow">
                <span>
                    <el-checkbox
                        v-model="form.published"
                        label="Published"
                        border />
                </span>
            </div>

            <!-- Name -->
            <div class="inputRow">
                <label>{{ $t('Name') }}:</label>
                <span>
                    <el-input v-model="form.name" />
                </span>
            </div>

            <!-- Description -->
            <div class="inputRow">
                <label>{{ $t('Description') }}:</label>
                <span>
                    <el-input
                        v-model="form.description"
                        type="textarea"
                        :rows="2" />
                </span>
            </div>

            <!-- Value -->
            <div class="inputRow">
                <label>{{ $t('Value') }}:</label>
                <span> {{ form.value }}</span>
            </div>

            <!-- SEO -->
            <text-card>
                <div slot="header">{{ $t('Search engine listing') }}</div>

                <!-- page title -->
                <div class="inputRow">
                    <label>{{ $t('Page title') }}:</label>
                    <span>
                        <el-input v-model="form.seo_page_title" />
                    </span>
                </div>

                <!-- description -->
                <div class="inputRow">
                    <label>{{ $t('Description') }}:</label>
                    <span>
                        <el-input
                            v-model="form.seo_page_desc"
                            type="textarea"
                            :rows="2" />
                    </span>
                </div>

                <!-- URI -->
                <div class="inputRow">
                    <label>{{ $t('URL and handle') }}:</label>
                    <span>
                        <el-input
                            v-model="form.seo_uri"
                            maxlength="50"
                            show-word-limit>
                            <template slot="prepend">https://{{ domainName }}/p/</template>
                        </el-input>
                    </span>
                </div>
            </text-card>

            <!-- buttons -->
            <div class="ptl">
                <el-button
                    type="primary"
                    @click="onFormSave">{{ $t('Save') }}</el-button>

                <el-button
                    @click="onFormCancel">{{ $t('Cancel') }}</el-button>
            </div>
        </app-dialog>
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
