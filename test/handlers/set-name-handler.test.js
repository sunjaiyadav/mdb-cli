'use strict';

const AuthHandler = require('../../utils/auth-handler');
const CliStatus = require('../../models/cli-status');
const sandbox = require('sinon').createSandbox();

describe('Handler: set-name', () => {

    let authHandler;
    let handler;

    beforeEach(() => {

        const handlerClass = require('../../utils/set-name-handler');
        authHandler = new AuthHandler(false);

        handler = new handlerClass(authHandler);
    });

    afterEach(() => {

        sandbox.reset();
        sandbox.restore();
    });

    it('should have `result` property', () => {

        expect(handler).to.have.property('result');
    });

    it('should `result` be an array', () => {

        expect(handler.result).to.be.a('array');
    });

    it('should have `name` property', () => {

        expect(handler).to.have.property('name');
    });

    it('should `name` be string', () => {

        expect(handler.name).to.be.a('string');
    });

    it('should have `authHandler` property', () => {

        expect(handler).to.have.property('authHandler');
    });

    it('should have assigned authHandler', () => {

        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);
    });

    it('should have assigned authHandler if not specyfied in constructor', (done) => {

        const handlerClass = require('../../utils/set-name-handler');
        handler = new handlerClass();
        expect(handler).to.have.property('authHandler');
        expect(handler.authHandler).to.be.an.instanceOf(AuthHandler);

        done();
    });

    it('should getResult() return result array', () => {

        const expectedResult = [{ fake: 'result' }];
        handler.result = expectedResult;

        const actualResult = handler.getResult();

        expect(actualResult).to.be.an('array');
        chai.assert.deepEqual(actualResult[0], expectedResult[0], 'getResult() returns invalid result');
    });

    it('should createPromptModule() be invoked in askForNewProjectName() invoke', async () => {

        const inquirer = require('inquirer');
        const promptStub = sandbox.stub().resolves({ name: 'stub' });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(promptStub.called === false, 'promptStub.called shouldn\'t be called');
        await handler.askForNewProjectName();
        expect(promptStub.called === true, 'promptStub.called should be called');
    });

    it('should askForNewProjectName() return expected result', async () => {

        const inquirer = require('inquirer');
        const expectedResult = 'stub';

        const promptStub = sandbox.stub().resolves({ name: expectedResult });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);

        expect(handler.name !== expectedResult, 'handler.name should have different name from expectedResult');
        await handler.askForNewProjectName();
        expect(handler.name === expectedResult, 'handler.name shold have the same name as expectedResult');
    });

    it('should setName() change project name', async () => {

        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'name';
        const oldName = 'oldName';
        const expectedResults = { 'Status': CliStatus.SUCCESS, 'Message': `Package name has been changed from ${oldName} to ${name} successful`};

        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        sandbox.stub(serializer, 'serializeJsonFile').resolves(undefined);
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ name: oldName });

        handler.name = name;
        expect(handler.result).to.be.an('array').that.is.empty;
        await handler.setName();
        expect(handler.result).to.deep.include(expectedResults);
    });

    it('should return expected result if problem with file deserialization', () => {

        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'name';
        const fileName = 'package.json';
        const expectedResults = { 'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with ${fileName} deserialization` };

        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        const fakeError = new Error('fake error');
        sandbox.stub(serializer, 'serializeJsonFile').resolves(undefined);
        sandbox.stub(deserializer, 'deserializeJsonFile').rejects(fakeError);

        handler.name = name;
        handler.setName().catch((error) => {

            expect(error).to.be.equal(fakeError);
            expect(handler.result[0]).to.deep.include(expectedResults);
        });
    });

    it('should return expected result if problem with file serialization', async () => {

        const fs = require('fs');
        const inquirer = require('inquirer');
        const serializer = require('../../helpers/serialize-object-to-file');
        const deserializer = require('../../helpers/deserialize-object-from-file');
        const name = 'name';
        const oldName = 'oldName';
        const fileName = 'package.json';
        const expectedResults = {'Status': CliStatus.INTERNAL_SERVER_ERROR, 'Message': `Problem with ${fileName} serialization`};
        const promptStub = sandbox.stub().resolves({ name: name });
        sandbox.stub(inquirer, 'createPromptModule').returns(promptStub);
        const fakeError = new Error('fake error');
        sandbox.stub(serializer, 'serializeJsonFile').rejects(fakeError);
        sandbox.stub(deserializer, 'deserializeJsonFile').resolves({ name: oldName });
        sandbox.stub(fs, 'writeFile');
        
        try {
            
            handler.name = name;
            await handler.setName();

        } catch (e) {
            
            expect(handler.result[0]).to.deep.include(expectedResults);
            expect(e).to.be.equal(fakeError);
        }
    });
});
