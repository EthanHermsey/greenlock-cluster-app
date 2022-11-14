//"use strict";
import path from "path";
import express from "express";
import greenlock from "greenlock-express";
import Cluster from './cluster/Cluster.js';
import { exec } from 'child_process';
import Config from './config/Config.js';


//setting up environment
console.log();
console.log( '--= Greenlock Cluster =--' );
console.log();
process.title = 'Greenlock Cluster';
global.__dirname = path.resolve( './' );
global.logErrorMessage = msg =>{

	const repeat = ( chr, t )=>new Array( t ).fill( chr ).join( '' );
	console.log( '' );
	console.log( repeat( '#', msg.length + 8 ) );
	console.log( `##  ${msg}  ##` );
	console.log( repeat( '#', msg.length + 8 ) );
	console.log( '' );

};

//create greenlock-express app
const app = express();
app.use( "/", ( _, res ) => config.homepage ? res.redirect( 301, config.homepage ) : res.status( 400 ).end() );
const setup = () =>{

	exec( `npx greenlock add --subject ${config.domain} --altnames ${config.domain}`, ()=>{

		console.log( 'Domain added: ' + config.domain + '.' );

		// greenlock
		// 	.init( {
		// 		packageRoot: __dirname,
		// 		configDir: "./greenlock.d",
		// 		maintainerEmail: config.email,
		// 		cluster: false
		// 	} )
		// 	.serve( app );

		setTimeout( () => {

			cluster.init();

		}, 600 );

	} );

};


//load config
const config = new Config();
config.on( 'load', ()=>setup() );
config.load();

//initialize cluster
const cluster = new Cluster( config );
