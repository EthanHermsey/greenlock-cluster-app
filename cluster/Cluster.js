import fs from 'fs';
import { exec } from 'child_process';
import express from 'express';
import greenlock from 'greenlock-express';
import Cli from '../cli/Cli.js';
import Pod from './Pod.js';

export default class Cluster {

	constructor( config ) {

		this.config = config;

		this.pods = {};
		this.certs = {};

		this.cli = new Cli( this );

	}

	setup() {

		if ( this.config.noConfig ) {

			this.cli.setup( this.config, ()=>this.setupDirectories() );

		} else {

			console.log( 'Config loaded' );
			this.setupDirectories();

		}

	}

	setupDirectories() {

		if ( ! fs.existsSync( __dir.db ) ) {

			fs.mkdirSync( __dir.db );
			console.log( 'Setup db directory' );

		}

		if ( ! fs.existsSync( __dir.db ) ) {

			fs.mkdirSync( __dir.db );
			console.log( 'Setup db directory' );

		}

		if ( ! fs.existsSync( __dir.pods ) ) {

			fs.mkdirSync( __dir.pods );
			console.log( 'Setup pods directory' );

		}

		this.setupDomain();

	}

	setupDomain() {

		//check domain in greenlock.d/config.json
		let add = false;
		if ( fs.existsSync( __dir.greenlock + '/config.json' ) ) {

			const greenlockConfig = fs.readFileSync( __dir.greenlock + '/config.json' ).toString();
			if ( greenlockConfig.search( this.config.domain ) < 0 ) add = true;

		} else {

			add = true;

		}

		//add domain
		if ( add ) {

			console.log( 'Setup domain ' + this.config.domain + ', this may take a few seconds.' );
			if ( ! fs.existsSync( __dir.greenlock ) ) fs.mkdirSync( __dir.greenlock );
			fs.writeFileSync( __dir.greenlock + '/config.json', `{"defaults": {"store": {"module": "greenlock-store-fs"}, "challenges": {"http-01": {"module": "acme-http-01-standalone"}},"renewOffset":"-45d","renewStagger":"3d","accountKeyType":"EC-P256","serverKeyType":"RSA-2048","subscriberEmail":"${this.config.email}"},"sites":[{"subject":"${this.config.domain}","altnames":["${this.config.domain}"],"renewAt":1672031968900}]}` );
			const addDomain = exec( `npx greenlock add --subject ${this.config.domain} --altnames ${this.config.domain}`, ()=>{

				this.startGreenlock();
				addDomain.kill();

			} );

		} else {

			this.startGreenlock();

		}

	}

	setupCerts( i = 300 ) {

		// this.start();
		if ( i == 300 ) console.log( 'Searching for SSL certificates..' );
		if ( i == 150 ) console.log( 'Still Searching for certificates..' );

		const isPrivkey = fs.existsSync( `./greenlock.d/live/${this.config.domain}/privkey.pem` );
		const isCert = fs.existsSync( `./greenlock.d/live/${this.config.domain}/cert.pem` );

		if ( isPrivkey && isCert ) {

			console.log( 'Found SSL certificates' );
			console.log();

			this.certs = {
				privkey: fs.readFileSync( `./greenlock.d/live/${this.config.domain}/privkey.pem` ).toString(),
				cert: fs.readFileSync( `./greenlock.d/live/${this.config.domain}/cert.pem` ).toString()
			};

			this.startPods();
			setTimeout( () => {

				this.cli.display();

			}, 200 );

		} else {

			if ( i <= 0 ) {

				console.error( "The certificates seem to be missing.. We've been looking for 30 seconds in ./greenlock.d/live/basis64.ddns.net/..." );
				return;

			}
			setTimeout( ()=>this.setupCerts( i - 1 ), 100 );

		}

	}

	startGreenlock() {

		const app = express();
		app.use( "/", ( _, res ) => this.config.homepage ? res.redirect( 301, this.config.homepage ) : res.status( 400 ).end() );

		greenlock
			.init( {
				packageRoot: __dir.root,
				configDir: __dir.greenlock,
				maintainerEmail: this.config.email
			} )
			.serve( app );

		setTimeout( () => {

			this.setupCerts();

		}, 600 );

	}

	quit() {

		console.log( 'Stopping cluster...' );

		Object.values( this.pods ).map( pod => pod.down( true ) );

		console.log( undefined, true ); //important
		console.log( 'Closed Greenlock Cluster.\n', true );
		process.exit( 0 );

	}


	//                            .o8
	//                           "888
	// oo.ooooo.   .ooooo.   .oooo888   .oooo.o
	//  888' `88b d88' `88b d88' `888  d88(  "8
	//  888   888 888   888 888   888  `"Y88b.
	//  888   888 888   888 888   888  o.  )88b
	//  888bod8P' `Y8bod8P' `Y8bod88P" 8""888P'
	//  888
	// o888o

	startPods() {

		this.loadPods();
		this.watchPods();

	}

	watchPods() {

		fs.watch( __dir.pods, () => {

			this.config.reload();
			this.loadPods();

		} );

	}

	loadPods() {

		//add
		this.config.pods.map( name => {

			if ( ! this.pods[ name ] ) {

				this.addPod( name );
				console.log( 'Loading pod ' + name );

			}

		} );

		//remove
		for ( const name in this.pods ) {

			if ( ! this.config.pods.includes( name ) ) {

				this.removePod( name );
				console.log( 'Removed pod ' + name );

			}

		}

		console.log();

	}

	addPod( name ) {

		this.pods[ name ] = new Pod( name, this.certs );

	}

	setPod( name, port, autorestart ) {

		if ( ! this.podExists( name ) ) return;
		this.pods[ name ].set( port, autorestart );

	}

	removePod( name ) {

		if ( fs.existsSync( __dir.db + `/${name}.json` ) ) fs.unlinkSync( __dir.db + `/${name}.json` );
		this.pods[ name ].down( true );
		delete this.pods[ name ];

	}

	podExists( name ) {

		if ( name == 'all' || this.pods[ name ] ) {

			return true;

		} else if ( name == undefined ) {

			console.log( "Pod name not provided. Add pod name or 'all' to the command." );

		} else {

			console.log( 'Pod with name ' + name + ' could not be found.' );

		}
		return false;

	}


}


