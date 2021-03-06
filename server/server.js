'use strict';

const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

// define the ssl configuration of the server API
const opts = {
	key: fs.readFileSync(path.join(__dirname, 'server_key.pem')),
	cert: fs.readFileSync(path.join(__dirname, 'server_cert.pem')),
	requestCert: true,
	rejectUnauthorized: false, // so we can do own error handling
	ca: [
		fs.readFileSync(path.join(__dirname, 'server_cert.pem'))
	]
};

// define the listening port and hostname
const port = 3033;
const host = 'localhost';

const app = express();

/** Define a middleware that will be tiggered for each route.
 * It will check that the client has a correct certificate before proceeding  * to the route.
 * If no certificate is given or if it is not authorized, then it will reject * with an error.
 **/ 
app.use((req, res, next) => {
	console.log('Authentication middleware triggered on %s', req.url);
	const cert = req.socket.getPeerCertificate();
	console.log(cert)
	if (req.client.authorized) {
                next();
        } else if (cert.subject) {
                res.status(403)
                         .send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`);
        } else {
                res.status(401)
                   .send(`Sorry, but you need to provide a client certificate to continue.`);
        }
})

/** Define the root route "/"
 * This route can only be accessed by an authenticated client.
 **/
app.get('/', (req, res) => {
        res.send('<p>You successfully accessed the protected content !</p>');
});

// create a https server
const server = https.createServer(opts, app);

// start the server and listen to the given host and port
server.listen(port, host, () => {
	var baseUrl = `https://${host}:${port}`;
	console.log(`
Server listening at ${baseUrl} :
To see demo, run in a new session:

  - \`npm run valid-client\`
  - \`npm run invalid-client\``);
})
