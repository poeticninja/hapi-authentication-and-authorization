/**
* Dependencies.
*/
var Hapi = require('hapi');

// Create a new server
var server = new Hapi.Server();

// Setup the server with a host and port
server.connection({
    port: parseInt(process.env.PORT, 10) || 3000,
    host: '0.0.0.0'
});

// Export the server to be required elsewhere.
module.exports = server;

/*
    Load all plugins and then start the server.
    First: community/npm plugins are loaded
    Second: project specific plugins are loaded
 */
server.register([
    {
        register: require("good"),
        options: {
            reporters: [{
                reporter: require('good-console'),
                events: { ops: '*', request: '*', log: '*', response: '*', 'error': '*' }
            }]
        }
    },
    {
        register: require('./server/auth/index.js')
    },
    {
        register: require('./server/example/index.js')
    },
    {
        register: require('./server/base/index.js')
    }
], function () {
    //Start the server
    server.start(function() {
        //Log to the console the host and port info
        console.log('Server started at: ' + server.info.uri);
    });
});
