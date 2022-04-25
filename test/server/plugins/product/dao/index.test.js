const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const Hoek = require('@hapi/hoek');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { init } = require('../../../../../server');
const ProductDao = require('../../../../../server/plugins/products/dao/ProductDao.js');

// const testProductId = '22c1b3da-f188-48ae-8aa1-5a8414d53ea8';
let testProductId;

describe('ProductDao:', () => {
    let server;
    let Dao;

    beforeEach(async () => {
        server = await init();
        Dao = new ProductDao(server);
    });

    afterEach(async () => {
        await server.stop();
    });


    it('should insert one new Product', async () => {
        const insertedIds = await Dao.tenantInsert(
            process.env.TEST_TENANT_ID,
            {
                published: true,
                title: 'Test title 1'
            });

        testProductId = insertedIds[0];

        expect(testProductId).not.to.equal(null);
    });


    // it('should get one Product', async () => {
    //     const product = await Dao.tenantGetOne(
    //         process.env.TEST_TENANT_ID,
    //         testProductId
    //     );

    //     expect(product.length).to.equal(1);

    //     Dao.hidden.forEach((key) => {
    //         expect(product.hasOwnProperty(key)).to.equal(false);
    //     });
    // });


    it('should get one Product with its relations', async () => {
        const testId = 'df3adcc5-1c00-4331-99a8-afeb502f0dd1';

        const product = await Dao.tenantGet(
            process.env.TEST_TENANT_ID,
            testId,
            '*'
        );

        expect(product.length).to.equal(1);

        Dao.hidden.forEach((key) => {
            expect(product.hasOwnProperty(key)).to.equal(false);
        });
    });



    it('should throw an error when inserting a new Product using invalid product attributes', async () => {
        let caught = false;

        try {
            await Dao.tenantInsert(
                process.env.TEST_TENANT_ID,
                {
                    wrong: 'This is wrong'
                }
            );
        }
        catch(e) {
            caught = true;
        }

        expect(caught).to.equal(true);
    });


    it('should successfully edit a product', async () => {
        const updatedIds = await Dao.tenantUpdate(
            process.env.TEST_TENANT_ID,
            testProductId,
            {
                title: 'Updated title'
            }
        );

        console.log("UPDATE RESPONSE", updatedIds)

        expect(updatedIds[0]).to.equal(testProductId);
    });


    it('should successfully delete a product', async () => {
        const deletedIds = await Dao.tenantDeleteOne(
            process.env.TEST_TENANT_ID,
            testProductId
        );

        expect(deletedIds[0]).to.equal(testProductId);
    });
});
