'use strict';

const Command = require('./command');
const LogoutHandler = require('../utils/logout-handler');
const AuthHandler = require('../utils/auth-handler');

class LogoutCommand extends Command {

    constructor(authHandler = new AuthHandler()) {

        super(authHandler);

        this.handler = new LogoutHandler(authHandler);

        this.setAuthHeader();
    }

    execute() {

        return this.handler.logout()
            .then(() => {

                this.result = this.handler.getResult();

                this.print();
            })
            .catch(console.error);
    }
}

module.exports = LogoutCommand;
