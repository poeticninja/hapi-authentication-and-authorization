'use strict';

/**
 * Dependencies.
 */
const Joi = require('joi');
const Boom = require('boom');
const Promise = require('bluebird');
const Hoek = require('hoek');

let uuid = 1; // Use seq instead of proper unique identifiers for demo only
const TTL = 24 * 60 * 60 * 1000; // Set session to 1 day


exports.register = function (server, options, next) {

    const cache = server.cache({
        segment: 'standard',
        expiresIn: TTL
    });

    server.app.cache = cache;

    // Set our server authentication strategy
    server.auth.strategy('standard', 'cookie', {
        cookie: 'app-cookie', // Cookie name
        password: 'somecrazycookiesecretthatcantbeguesseswouldgohere', // cookie secret
        isSecure: false, // required for non-https applications
        ttl: TTL,
        validateFunc: function (request, session, callback) {

            cache.get(session.sid, (err, cached) => {

                if (err) {
                    return callback(err, false);
                }

                if (!cached) {
                    return callback(null, false);
                }
                return callback(null, true, cached.account);
            });
        }
    });

    server.auth.default({
        strategy: 'standard',
        scope: ['admin']
    });

    server.route([{
        method: 'GET',
        path: '/login',
        config: {
            auth : {
                mode: 'try'
            },
            handler: function (request, reply) {

                if (request.auth.isAuthenticated) {
                    return reply.redirect('/');
                }

                return reply('<html><head><title>Login page</title></head><body>' +
                    '<form method="post" action="/login">' +
                    'Email:<br><input type="text" name="email" ><br>' +
                    'Password:<br><input type="password" name="password"><br/><br/>' +
                    '<input type="submit" value="Login"></form></body></html>');
            }
        }
    }, {
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
            handler: function (request, reply) {

                const email = request.payload.email;
                const password = request.payload.password;

                let message = '';
                let account = null;

                if (!email || !password) {

                    message = 'Missing username or password';

                } else {

                    getValidatedUser(request.payload.email, request.payload.password)
                    .then(function (user) {

                        if (user) {

                            const sid = String(++uuid);

                            request.server.app.cache.set(sid, { account: user}, 0, (err) => {

                                Hoek.assert(!err, err);

                                request.cookieAuth.set({ sid: sid });
                                
                                return reply.redirect('/');
                            });

                        } else {

                            return reply(Boom.unauthorized('Bad email or password'));
                        }
                    })
                    .catch(function (err) {
                        return reply(Boom.badImplementation());
                    });
                }
            }
        }
    }, {
        method: 'GET',
        path: '/logout',
        config: {
            auth: false,
            handler: function (request, reply) {

                request.cookieAuth.clear();
                return reply('Logout Successful!');

            }
        }
    }]);

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

function getValidatedUser(email, password) {
    return new Promise(function (fulfill, reject) {

        var users = [{
            id: 123,
            username: 'admin',
            email: 'admin@admin.com',
            password: 'admin',
            scope: ['user', 'admin', 'user-123']
        }, {
            id: 124,
            username: 'guest',
            email: 'guest@guest.com',
            password: 'guest',
            scope: ['user', 'user-124']
        }, {
            id: 125,
            username: 'other',
            email: 'other@other.com',
            password: 'other',
            scope: ['user', 'user-125']
        }];

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
