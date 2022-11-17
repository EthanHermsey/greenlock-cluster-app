import fs from 'fs';
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

			this.cli.setup( this.config, ()=>this.checkDirectories() );
			return;

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

			console.log( 'Setup domain ' + this.config.domain );
			if ( ! fs.existsSync( __dir.greenlock ) ) fs.mkdirSync( __dir.greenlock );
			fs.writeFileSync( __dir.greenlock + '/config.json', `{ "sites": [{ "subject": "${this.config.domain}", "altnames": ["${this.config.domain}"] }] }` );

		}

		this.setupCerts();

	}

	setupCerts( i = 300 ) {

		// this.start();
		if ( i == 300 ) console.log( 'Searching for SSL certificates..' );
		if ( i == 150 ) console.log( 'Still Searching for certificates..' );

		const isPrivkey = fs.existsSync( `./greenlock.d/live/${this.config.domain}/privkey.pem` );
		const isCert = fs.existsSync( `./greenlock.d/live/${this.config.domain}/cert.pem` );

		if ( isPrivkey && isCert ) {

			this.certs = {
				privkey: fs.readFileSync( `./greenlock.d/live/${this.config.domain}/privkey.pem` ).toString(),
				cert: fs.readFileSync( `./greenlock.d/live/${this.config.domain}/cert.pem` ).toString()
			};

			console.log( 'Found SSL certificates\n' );
			this.start();

		} else {

			if ( i <= 0 ) {

				console.error( "The certificates seem to be missing.. We've been looking for 30 seconds in ./greenlock.d/live/basis64.ddns.net/..." );
				return;

			}
			setTimeout( ()=>this.setupCerts( i - 1 ), 100 );

		}

	}

	start() {

		const app = express();
		app.use( "/", ( _, res ) => this.config.homepage ? res.redirect( 301, this.config.homepage ) : res.status( 400 ).end() );

		greenlock
			.init( {
				packageRoot: __dir.root,
				configDir: __dir.greenlock,
				maintainerEmail: this.config.email
			} )
			.serve( app );

		this.loadPods();
		this.watchPods();

		setTimeout( () => {

			console.log();
			this.cli.display();

		}, 600 );

	}

	quit() {

		console.log( 'Stopping cluster...' );

		Object.keys( this.pods ).map( name => this.removePod( name ) );

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

		// console.log( '', true ); //important

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


