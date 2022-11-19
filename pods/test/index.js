"use strict";
const https = require( 'https' );
const express = require( 'express' );

//GREENLOCK CLUSTER PID HOOK
eval( process.env.REPORT )();

const app = express();
app.use( "/", function ( req, res ) {

	res.setHeader( "Content-Type", "text/html; charset=utf-8" );
	res.end( "Hello, World!\n\n💚 🔒.js" );

} );

https.createServer(
	{
		key: process.env.PRIVKEY,
		cert: process.env.CERT
	},
	app
).listen( process.env.PORT || 3000, () => {

	console.log( `TestServer: Listening on port: ${process.env.PORT || 3000}` );

} );
