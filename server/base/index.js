var Boom = require('boom');

exports.register = function(server, options, next){

    server.route({
        method: 'GET',
        path: '/',
        config: {
            auth: false,
            handler: function(request, reply){
                reply('Hello World!');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/{path*}',
        config: {
            auth: false,
            handler: function(request, reply){
                reply(Boom.notFound());
            }
        }
    });

    next();
}

exports.register.attributes = {
    name: 'base'
};
