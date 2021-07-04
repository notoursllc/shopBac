require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
// const App = require('../server');
const Path = require('path');

const internals = {};

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const it = lab.test;

const manifest = {
    server: {
        port: 0
    },
    register: {
        plugins: []
    }
};

const composeOptions = {
    // Relative to the real hapi server
    relativeTo: Path.resolve(__dirname, '../../server')
};


// it('starts server and returns hapi server object', (done) => {
//
//     const manifest = {};
//     const options = {};
//
//     App.init(manifest, options, (err, server) => {
//
//         expect(err).to.not.exist();
//         expect(server).to.be.instanceof(Hapi.Server);
//
//         server.stop(done);
//     });
// });

// it('starts server on provided port', (done) => {
//
//     const manifest = {
//         connections: [
//             {
//                 port: 5000
//             }
//         ]
//     };
//     const options = {};
//
//     App.init(manifest, options, (err, server) => {
//
//         expect(err).to.not.exist();
//         expect(server.info.port).to.equal(5000);
//
//         server.stop(done);
//     });
// });

// it('handles register plugin errors', { parallel: false }, (done) => {
//
//     const orig = Version.register;
//     Version.register = function (server, options, next) {
//
//         Version.register = orig;
//         return next(new Error('register version failed'));
//     };
//
//     Version.register.attributes = {
//         name: 'fake version'
//     };
//
//     App.init(manifest, composeOptions, (err, server) => {
//
//         expect(err).to.exist();
//         expect(err.message).to.equal('register version failed');
//
//         done();
//     });
// });





