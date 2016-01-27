'use strict';

/**
 * Dependencies.
 */
const AuthCookie = require('hapi-auth-cookie');
const Good = require('good');
const Hapi = require('hapi');
const Hoek = require('hoek');


const AuthIndex = require('./server/auth/index.js');
const Base = require('./server/base/index.js');
const Example = require('./server/example/index.js');


// Create a new server
const server = new Hapi.Server();

// Setup the server with a host and port
server.connection({
    port: parseInt(process.env.PORT, 10) || 3000,
    host: '0.0.0.0',
    router: {
        stripTrailingSlash: true
    }
});

// Export the server to be required elsewhere.
module.exports = server;

/*
    Load all plugins and then start the server.
    First: community/npm plugins are loaded
    Second: project specific plugins are loaded
 */
server.register(
    [
        {
            register: Good,
            options: {
                reporters: [{
                    reporter: require('good-console'),
                    events: {
                        //ops: '*',
                        request: '*',
                        log: '*',
                        response: '*',
                        'error': '*'
                    }
                }]
            }
        },
        AuthCookie,
        AuthIndex,
        Base,
        Example
    ], (err) => {

    Hoek.assert(!err, err);

    //Start the server
    server.start(function () {
        //Log to the console the host and port info
        console.log('Server started at: ' + server.info.uri);
    });
});
