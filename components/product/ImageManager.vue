<script>
export default {
    name: 'ImageManager',

    components: {
        PopConfirm: () => import('@/components/PopConfirm'),
        draggable: () => import('vuedraggable')
    },

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
            accept: 'image/png, image/jpeg, image/gif'
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
                    this.fileList = newVal;
                }
            },
            immediate: true
        }
    },

    methods: {
        emitChange() {
            this.$emit('input', this.fileList);
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

        onFileChange(files) {
            if (!files.length) {
                return;
            }

            if(!this.filesAreAcceptedTypes(files)) {
                throw new Error('File type not allowed');
            }

            this.createTempImages(files);
            this.emitChange();
            this.$refs['file-input'].reset();
        },

        createTempImages(files) {
            this.loading = true;

            if(files) {
                // https://stackoverflow.com/a/40902462
                Array.prototype.forEach.call(files, (file) => {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        this.fileList.push({
                            id: null,
                            image_url: e.target.result,
                            alt_text: null,
                            // raw: file,
                            ordinal: this.fileList.length
                        });
                        // console.log("ADDING TO FILELIST", file.name)
                    };

                    reader.readAsDataURL(file);
                });

                this.setOrdinals();
            }

            this.loading = false;
        },

        onDeleteImage(obj, index) {
            if(obj.id) {
                this.$emit('delete', obj.id);
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
        }
    }
};
</script>


<template>
    <div v-cloak
         v-loading="loading"
         class="widthAll">

        <draggable
            v-model="fileList"
            ghost-class="ghost"
            handle=".handle"
            @update="setOrdinals">

            <div class="image-row" v-for="(obj, index) in fileList" :key="index">
                <div class="image-row-fields">
                    <div class="image-row-handle" v-if="fileList.length > 1">
                        <i class="handle">
                            <svg-icon icon="dots-vertical-double" />
                        </i>
                    </div>

                    <div class="image-row-pic">
                        <b-img
                            :src="obj.image_url"
                            class="cursorPointer"
                            @click="onPreview(obj.image_url)"
                            alt=""></b-img>
                    </div>

                    <div class="image-row-input">
                        <div class="phm widthAll">
                            <b-form-input
                                v-model="obj.alt_text"
                                class="widthAll"
                                placeholder="Image alt text"
                                @input="emitChange"
                                multiple />
                            <div class="input-tip">{{ $t('Image_alt_text_description') }}</div>
                        </div>

                        <pop-confirm @onConfirm="onDeleteImage(obj, index)">
                            {{ $t('Delete this item?') }}

                            <b-button
                                slot="reference"
                                variant="outline-secondary">
                                <svg-icon icon="trash" />
                            </b-button>
                        </pop-confirm>
                    </div>
                </div>
            </div>

        </draggable>

        <div class="mtm">
            <b-form-file
                id="file-input"
                ref="file-input"
                :accept="accept"
                :multiple="true"
                v-show="numRemainingUploads > 0"
                @input="onFileChange"
                :placeholder="$t('No file chosen')"
                :browse-text="$t('Choose images')"></b-form-file>
        </div>

        <b-modal
            ref="image_preview_modal"
            size="xl"
            hide-footer>
            <b-img
                :src="dialogImageUrl"
                alt=""></b-img>
        </b-modal>
    </div>
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
