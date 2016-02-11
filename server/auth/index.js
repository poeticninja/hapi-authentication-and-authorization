var Joi = require('joi');
var Boom = require('boom');
var Promise = require('bluebird');

exports.register = function(server, options, next){

    server.register([
        {
            register: require('hapi-auth-cookie')
        }
    ], function(err) {
        if (err) {
            console.error('Failed to load a plugin:', err);
            throw err;
        }

        // Set our server authentication strategy
        server.auth.strategy('standard', 'cookie', {
            password: 'somecrazycookiesecretthatcantbeguesseswouldgohere', // cookie secret
            cookie: 'app-cookie', // Cookie name
            isSecure: false, // required for non-https applications
            ttl: 24 * 60 * 60 * 1000 // Set session to 1 day
        });

    });

    server.auth.default({
        strategy: 'standard',
        scope: ['admin']
    });

    server.route({
        method: 'POST',
        path: '/login',
        config: {
            auth: false,
            validate: {
                payload: {
                    email: Joi.string().email().required(),
                    password: Joi.string().min(2).max(200).required()
                }
            },
            handler: function(request, reply) {

                getValidatedUser(request.payload.email, request.payload.password)
                    .then(function(user){

                        if (user) {
                            request.cookieAuth.set(user);
                            return reply('Login Successful!');
                        } else {
                            return reply(Boom.unauthorized('Bad email or password'));
                        }

                    })
                    .catch(function(err){
                        return reply(Boom.badImplementation());
                    });

            }
        }
    });

    server.route({
        method: 'GET',
        path: '/logout',
        config: {
            auth: false,
            handler: function(request, reply) {

                request.cookieAuth.clear();
                return reply('Logout Successful!');

            }
        }
    });

    next();
}

exports.register.attributes = {
    name: 'auth'
};



/**
 * REALLY STUPID GET VALID USER - NOT FOR PRODUCITON USE.
 * Replace this with your own database lookup and make sure
 * you encrypt the passwords. Plain text passwords should not be used.
 * AGAIN THIS IS JUST TO GET THIS EXAMPLE WORKING!
 */

function getValidatedUser(email, password){
    return new Promise(function(fulfill, reject){

        var users = [
            {
                id: 123,
                email: 'admin@admin.com',
                password: 'admin',
                scope: ['user', 'admin', 'user-123']
            },
            {
                id: 124,
                email: 'guest@guest.com',
                password: 'guest',
                scope: ['user', 'user-124']
            },
            {
                id: 125,
                email: 'other@other.com',
                password: 'other',
                scope: ['user', 'user-125']
            }
        ];

        // This is done to remove the password before being sent.
        function grabCleanUser(user) {
            var user = user;
            delete user.password;
            return user;
        };

        // very simple look up based on the user array above.
        if (email === users[0].email && password === users[0].password) {
            return fulfill(grabCleanUser(users[0]));
        } else if (email === users[1].email && password === users[1].password) {
            return fulfill(grabCleanUser(users[1]));
        } else if (email === users[2].email && password === users[2].password) {
            return fulfill(grabCleanUser(users[2]));
        } else {
            return reject(null);
        }
    });
}
