const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');

function getAxios() {
    if(!getAxios.$axios) {
        getAxios.$axios = axios.create({
            baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/`,
            headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_AUTH_TOKEN}`,
                // 'Content-Type': 'application/json',
            },
            timeout: 10000, // wait for 10s
            validateStatus() {
                return true;
            }
        });
    }

    return getAxios.$axios;
}


async function postImage(file) {
    global.logger.info('REQUEST: CloudflareAPI.postImage', {
        meta: file
    });

    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(file.path));

        // update request headers:
        const instance = getAxios();
        instance.defaults.headers = {
            ...instance.defaults.headers,
            ...form.getHeaders()
        };

        const res = await instance.post('images/v1', form);

        global.logger.info('REQUEST: CloudflareAPI.postImage - Cloudflare response', {
            meta: res.data
        });

        if(!res.data.success) {
            throw new Error(
                (Array.isArray(res.data.errors) && res.data.errors.length)
                    ?  res.data.errors.join(' / ')
                    : 'An error occured when uploading the file'
            );
        }

        return res.data.result;
    }
    catch (error) {
        if(instance.isAxiosError(error)) {
            throw new Error(error.response.data.errors)
        }
        throw new Error(error)
    }
}


module.exports = {
    postImage
};
