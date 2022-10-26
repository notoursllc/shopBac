require('dotenv').config();

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const BunnyAPI = require('./BunnyAPI');

let createdVideoId;

describe('BunnyAPI.video', { timeout: 10000 }, () => {

    it('Should create a video', async () => {
        const videoTitle = `test vid title ${ new Date().getTime() }`;
        const res = await BunnyAPI.video.create(videoTitle);
        createdVideoId = res.guid;

        // console.log("CREATED VID", createdVideoId)

        expect(res.guid).not.to.be.null();
    });

    it('Should list videos', async () => {
        const res = await BunnyAPI.video.list();
        expect(Array.isArray(res.items)).to.be.true();
    });


    it('Should find the video we just created in the list', async () => {
        const res = await BunnyAPI.video.list();
        const found = res.items.find(obj => obj.guid === createdVideoId);
        expect(found).not.to.be.undefined();
    });


    it('Should return a 404 error when deleting a video that does not exist', async () => {
        const res = await BunnyAPI.video.del('fakeId');
        expect(res.statusCode).to.equal(404);
    });


    it('Should delete a video', async () => {
        const res = await BunnyAPI.video.del(createdVideoId);
        expect(res.statusCode).to.equal(200);
    });


    it('Should upload a video', async () => {
        const res = await BunnyAPI.video.upload('/Users/bruins/Downloads/IMG_9547.MOV');
        expect(res.statusCode).to.equal(200);
        expect(res.id).not.to.be.undefined();
        expect(res.directPlayUrl).not.to.be.undefined();
    });

});
