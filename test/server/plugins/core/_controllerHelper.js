const Hoek = require('@hapi/hoek');
const testHelpers = require('../../testHelpers');
const serverSetup = require('./_serverSetup');
const controller = require('../../../../server/plugins/core/controllers/BaseController');

let manifest = Hoek.clone(serverSetup.manifest);


async function getServer(manifest) {
    let m = manifest || Hoek.clone(serverSetup.manifest);
    return await testHelpers.getServer(m, serverSetup.composeOptions);
}


async function initController() {
    const server = await getServer();
    controller.setServer(server);

    return {
        controller,
        server
    };
}


function getManifest() {
    return manifest;
}


module.exports = {
    getServer,
    initController,
    getManifest
}
