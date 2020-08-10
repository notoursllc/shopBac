<script>
import product_mixin from '@/mixins/product_mixin';

export default {
    name: 'ImageManager',

    components: {
        PopConfirm: () => import('@/components/PopConfirm'),
        AppOverlay: () => import('@/components/AppOverlay'),
        draggable: () => import('vuedraggable')
    },

    mixins: [
        product_mixin
    ],

    props: {
        value: {
            type: Array,
            default: () => {
                return [];
            }
        },

        maxNumImages: {
            type: Number,
            default: 10
        }
    },

    data() {
        return {
            loading: false,
            dialogImageUrl: '',
            fileList: [],
            accept: 'image/png, image/jpeg, image/gif',
            fileInputErrorMessage: ''
        };
    },

    computed: {
        numRemainingUploads() {
            return this.maxNumImages - this.fileList.length;
        }
    },

    watch: {
        value: {
            handler(newVal) {
                if(Array.isArray(newVal)) {
                    // change the media url of each image to the smallest variant
                    this.fileList = newVal.map((obj) => {
                        obj.media = {
                            url: this.prodmix_getSmallestSkuImageMediaUrl(obj.media)
                        };
                        return obj;
                    });
                }
            },
            immediate: true
        }
    },

    methods: {
        emitChange() {
            this.$emit('input', this.fileList);
        },

        emitDelete(id) {
            this.$emit('delete', id);
        },

        onPreview(file) {
            this.dialogImageUrl = file;
            this.$refs.image_preview_modal.show();
        },

        filesAreAcceptedTypes(files) {
            const acceptedTypes = this.accept.split(',').map((type) => { return type.trim() });
            let isAcceptedType = true;

            for (let i = 0; i < files.length; i++) {
                if (acceptedTypes.indexOf(files[i].type) === -1) {
                    isAcceptedType = false;
                }
            }

            return isAcceptedType;
        },

        async onFileChange(files) {
            if (!files.length) {
                return;
            }

            if(!this.filesAreAcceptedTypes(files)) {
                throw new Error(this.$t('File type not allowed'));
            }

            const imageOverage = (this.fileList.length + files.length) - this.maxNumImages;

            if(imageOverage > 0) {
                const numRemaining = this.maxNumImages - this.fileList.length;
                this.fileInputErrorMessage = numRemaining === 1
                    ? this.$t('You can choose only one more image')
                    : this.$t('You can choose only _num_ more images', {number: numRemaining});
                return;
            }

            this.fileInputErrorMessage = '';

            if(Array.isArray(files)) {
                const resizePromises = [];
                const newFileListIndexes = [];

                files.forEach((file) => {
                    resizePromises.push(
                        this.$api.media.postImage(file)
                    );

                    newFileListIndexes.push(this.fileList.length);
                    const newOrdinal = this.fileList.length;

                    this.fileList.push({
                        id: null,
                        media_id: null,
                        alt_text: null,
                        is_featured: false,
                        ordinal: newOrdinal,
                        loading: true,
                        media: {
                            url: null
                        }
                    });
                });

                const responses = await Promise.all(resizePromises);
                // console.log("RESPONSES", responses);

                responses.forEach((res, index) => {
                    const fileListIndex = newFileListIndexes[index];

                    this.fileList[fileListIndex].media_id = res.id;
                    this.fileList[fileListIndex].media.url = this.prodmix_getSmallestSkuImageMediaUrl(res);
                    this.fileList[fileListIndex].loading = false;
                });
            }

            // this.createTempImages(files);
            this.emitChange();
            this.$refs['file-input'].reset();
        },

        onDeleteImage(obj, index) {
            if(obj.id) {
                this.emitDelete(obj.id);
            }

            // If this is a newly uploaded image then all we need to do
            // is splice it from the fileList
            this.fileList.splice(index, 1);
            this.setOrdinals();
            this.emitChange();
        },

        setOrdinals() {
            this.fileList.forEach((obj, index) => {
                obj.ordinal = index;
            });
        },

        fileInputValueFormatter(files) {
            const numFiles = files.length;
            return this.$tc('_num_ images selected', numFiles, {number: numFiles});
        },

        onFeaturedImageChanged(index) {
            this.fileList.forEach((obj, idx) => {
                obj.is_featured = (idx === index);
            });
        }
    }
};
</script>


<template>
    <app-overlay
        :show="loading"
        class="widthAll">

        <b-table-simple
            hover
            small
            responsive
            v-if="fileList.length"
            table-class="bread-table mbl">
            <b-thead>
                <b-tr>
                    <b-th v-if="fileList.length > 1" class="width50"></b-th>
                    <b-th class="width100"></b-th>
                    <b-th>
                        {{ $t('Alt text') }}
                        <i class="cursorPointer" v-b-tooltip.hover :title="$t('Image_alt_text_description')">
                            <svg-icon icon="info-circle" />
                        </i>
                    </b-th>
                    <b-th class="text-center">
                        {{ $t('Featured variant image') }}
                        <i class="cursorPointer" v-b-tooltip.hover :title="$t('Featured images represent this variant on the product list page')">
                            <svg-icon icon="info-circle" />
                        </i>
                    </b-th>
                    <b-th class="width100"></b-th>
                </b-tr>
            </b-thead>

            <draggable
                v-model="fileList"
                ghost-class="ghost"
                handle=".handle"
                @update="setOrdinals"
                tag="b-tbody">

                <b-tr v-for="(obj, index) in fileList" :key="index">
                    <!-- handle -->
                    <b-td v-if="fileList.length > 1" class="vam">
                        <i class="handle">
                            <svg-icon icon="dots-vertical-double" />
                        </i>
                    </b-td>

                    <!-- thumbnail -->
                    <b-td>
                        <template v-if="obj.loading">
                            <app-overlay :show="obj.loading">
                                <b-img
                                    v-bind="{ blank: true, width: 100, height: 75, class: 'm1' }"
                                    alt="uploading"></b-img>
                            </app-overlay>
                        </template>
                        <template v-else>
                            <b-img
                                :src="obj.media.url"
                                class="cursorPointer"
                                @click="onPreview(obj.url)"
                                :alt="obj.alt_text"></b-img>
                        </template>
                    </b-td>

                    <!-- alt text -->
                    <b-td class="vam">
                        <b-form-input
                            v-model="obj.alt_text"
                            class="widthAll"
                            placeholder="Image alt text"
                            @input="emitChange"
                            multiple />
                    </b-td>

                    <!-- is featured -->
                    <b-td class="text-center vam">
                        <!-- using a checkbox so its possible for no featured images to be selected -->
                        <b-form-checkbox
                            v-model="obj.is_featured"
                            @change="onFeaturedImageChanged(index)"></b-form-checkbox>
                    </b-td>

                    <!-- actions -->
                    <b-td class="text-center vam">
                        <pop-confirm
                            @onConfirm="onDeleteImage(obj, index)"
                            v-if="!obj.loading">
                            {{ $t('Delete this item?') }}

                            <b-button
                                slot="reference"
                                variant="outline-secondary"
                                class="mls border-dashed-2">
                                <svg-icon icon="trash" stroke-width="1px" width="18" height="18" />
                            </b-button>
                        </pop-confirm>
                    </b-td>
                </b-tr>
            </draggable>
        </b-table-simple>

        <div>
            <b-form-group
                :description="$t('You can upload num more images', {number: numRemainingUploads} )"
                :invalid-feedback="fileInputErrorMessage"
                :state="false">
                <b-form-file
                    id="file-input"
                    ref="file-input"
                    :accept="accept"
                    :multiple="true"
                    v-show="numRemainingUploads > 0"
                    @input="onFileChange"
                    :placeholder="$t('No file chosen')"
                    :browse-text="$t('Choose images')"
                    :file-name-formatter="fileInputValueFormatter"></b-form-file>
            </b-form-group>
        </div>

        <b-modal
            ref="image_preview_modal"
            size="xl"
            hide-footer>
            <b-img
                :src="dialogImageUrl"
                alt=""></b-img>
        </b-modal>
    </app-overlay>
</template>

<style lang="scss">
@import "~assets/css/components/_mixins.scss";

.el-upload-list--picture .el-upload-list__item {
    border: 0 !important;
    margin: 5px 0;
    padding: 0;
    height: auto;
}

.ghost {
    opacity: 0.5;
    background: #c8ebfb;
}

.image-row {
    @include flexbox();
    @include flex-direction(column);
}
.image-row-fields {
    @include flexbox();
}
.image-row-handle {
    @include flexbox();
    @include align-items(center);
    @include flex(0 0 30px);
    padding: 2px 5px 2px 0;

    svg {
        cursor: grab;
    }
}
.image-row-pic {
    @include flex(0 0 120px);
    padding: 2px 5px 2px 0;

    img {
        width: 120px;
        max-height: 120px;
    }
}
.image-row-input {
    @include flexbox();
    @include flex(1 1 auto);
    @include align-items(flex-start);
    padding: 2px 5px 2px 0;

    .input-tip {
        font-size: 12px;
        line-height: 12px;
        padding-top: 5px;
    }
}
</style>
