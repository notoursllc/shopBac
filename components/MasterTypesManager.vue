<script>
import isObject from 'lodash.isobject';
import slugify from 'slugify';

export default {
    components: {
        Fab: () => import('@/components/Fab'),
        OperationsDropdown: () => import('@/components/OperationsDropdown'),
        BooleanTag: () => import('@/components/BooleanTag'),
        MetaDataBuilder: () => import('@/components/MetaDataBuilder'),
        AppTable: () => import('@/components/AppTable')
    },

    props: {
        object: {
            type: String,
            required: true
        }
    },

    data() {
        return {
            form: {
                name: null,
                slug: null,
                published: true,
                description: null,
                metadata: null
            },
            formHasMetaData: false,
            types: [],
            tableData: {
                headers: [
                    { key: 'name', label: this.$t('Name'), sortable: true },
                    { key: 'slug', label: this.$t('Slug'), sortable: true },
                    { key: 'published', label: this.$t('Published'), sortable: true }
                ]
            }
        };
    },

    computed: {
        slugIdea() {
            if(this.form.name) {
                return slugify(this.form.name, { lower: true });
            }
            return '';
        }
    },

    watch: {
        object: {
            handler(newVal) {
                this.form.object = newVal;
                this.fetchTypes();
            },
            immediate: true
        }
    },

    methods: {
        async fetchTypes(paramsObj) {
            try {
                this.types = await this.$api.masterTypes.list({
                    where: ['object', '=', this.object],
                    // whereRaw: ['sub_type & ? > 0', [productTypeId]],
                    // andWhere: [
                    //     ['total_inventory_count', '>', 0]
                    // ],
                    ...paramsObj
                });

            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        sortChanged(val) {
            this.fetchTypes(val);
        },

        async onDeleteClick(data) {
            try {
                const confirmed = await this.$confirmModal(
                    this.$t('delete_name?', {'name': data.name}),
                    'warning'
                );

                if(!confirmed) {
                    return;
                }

                const typeJson = await this.$api.masterTypes.delete(data.id);

                if(!typeJson) {
                    throw new Error(this.$t('Master type not found'));
                }

                this.fetchTypes();
                this.$successToast(
                    this.$t('deleted_name', { name: data.name })
                );
            }
            catch(err) {
                this.$errorToast(err.message);
            }
        },

        async onUpsertClick(data) {
            try {
                this.clearForm();

                if(isObject(data) && data.id) {
                    const masterType = await this.$api.masterTypes.get(data.id);

                    if(!masterType) {
                        throw new Error(this.$t('Master Type not found'));
                    }

                    Object.keys(masterType).forEach((key) => {
                        this.form[key] = masterType[key];
                    });

                    this.formHasMetaData = Array.isArray(this.form.metadata);
                }
                else {
                    const masterTypes = await this.$api.masterTypes.all({
                        where: ['object', '=', this.object]
                    });
                    this.form.published = true;
                    this.form.value = this.$api.masterTypes.getNextAvailableTypeValue(masterTypes);
                }

                this.showDialog();
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        clearForm() {
            Object.keys(this.form).forEach((key) => {
                if(key !== 'object') {
                    this.form[key] = null;
                }
            });
        },

        async onUpsertFormSave() {
            try {
                this.form.object = this.object;

                if(!this.formHasMetaData) {
                    this.form.metadata = null;
                }

                const mt = await this.$api.masterTypes.upsert(this.form);

                if(!mt) {
                    throw new Error(this.$t('Error updating Master Type'));
                }

                this.$successToast(
                    this.$t(this.form.id ? 'updated_name' : 'added_name', { name: mt.name }),
                    null,
                    { hideOthers: true }
                );
                this.showDialog(false);
                this.fetchTypes();
            }
            catch(e) {
                this.$errorToast(e.message);
            }
        },

        showDialog(show) {
            show === false ? this.$refs.type_upsert_modal.hide() : this.$refs.type_upsert_modal.show();
        },

        onUpsertFormCancel() {
            this.showDialog(false);
        },

        onUseSlugSuggestion() {
            this.form.slug = this.slugIdea;
        }
    }
};
</script>


<template>
    <div>
        <fab icon="plus" @click="onUpsertClick" />

        <app-table
            :items="types"
            :fields="tableData.headers"
            @column-sort="sortChanged">

            <!-- name -->
            <template v-slot:cell(name)="row">
                {{ row.item.name }}
                <operations-dropdown
                    :show-view="false"
                    @edit="onUpsertClick(row.item)"
                    @delete="onDeleteClick(row.item)"
                    class="mls" />
            </template>

            <!-- slug -->
            <template v-slot:cell(slug)="row">
                {{ row.item.slug }}
            </template>

            <!-- published -->
            <template v-slot:cell(published)="row">
                <boolean-tag :value="row.item.published" />
            </template>
        </app-table>

        <b-modal
            ref="type_upsert_modal"
            size="xl"
            hide-footer
            :title="form.id ? `Edit Master Type (${object})` : `Add Master Type (${object})`">

            <div class="displayTable widthAll">
                <!-- Available -->
                <div class="formRow">
                    <label class="width100">{{ $t('Published') }}:</label>
                    <span>
                        <b-form-checkbox
                            v-model="form.published"></b-form-checkbox>
                    </span>
                </div>

                <!-- Name -->
                <div class="formRow">
                    <label>{{ $t('Name') }}:</label>
                    <span>
                        <b-form-input v-model="form.name" />
                    </span>
                </div>

                <!-- Slug -->
                <div class="formRow">
                    <label>{{ $t('Slug') }}:</label>
                    <span>
                        <b-form-input v-model="form.slug" />
                        <div class="fs12" v-show="slugIdea">
                            <span class="colorGrayLighter">{{ $t('Suggestion') }}:</span>&nbsp;&nbsp;{{ slugIdea }}&nbsp;
                            (<a @click="onUseSlugSuggestion" class="underlineDotted">{{ $t('use this') }}</a>)
                        </div>
                    </span>
                </div>

                <!-- Description -->
                <div class="formRow">
                    <label>{{ $t('Description') }}:</label>
                    <span>
                        <b-form-textarea
                            v-model="form.description"
                            :rows="2" />
                    </span>
                </div>

                <!-- Meta data -->
                <div class="formRow">
                    <label>{{ $t('Meta data') }}:</label>
                    <span>
                        <b-form-checkbox
                            v-model="formHasMetaData">{{ $t('This item has additional meta data') }}</b-form-checkbox>
                        <div class="mtm" v-show="formHasMetaData">
                            <meta-data-builder v-model="form.metadata" />
                        </div>
                    </span>
                </div>

                <!-- buttons -->
                <div class="formRow">
                    <label></label>
                    <span class="ptl">
                        <b-button
                            variant="primary"
                            @click="onUpsertFormSave"
                            class="mrm">{{ $t('Save') }}</b-button>

                        <b-button
                            variant="light"
                            @click="onUpsertFormCancel">{{ $t('Cancel') }}</b-button>
                    </span>
                </div>
            </div>
        </b-modal>
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
