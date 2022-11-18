import Interface from './Interface.js';
import readline from 'readline';

export default class Cli {

	constructor( cluster ) {

		this.cluster = cluster;
		this.commandInterface = new Interface( this, cluster );

		this.readline = readline.createInterface( {
			input: process.stdin,
			output: process.stdout
		} );
		this.readline.on( "SIGINT", ()=>this.commandInterface.quit() );
		this.question = false;
		this.interceptLogs();


	}

	interceptLogs() {

		console.error = ( msg )=> 'error: ' + msg;
		console.log = ( data, preventPrePost )=>{

			if ( data ) {

				data = String( data )
					.replace( /"/g, '' )
					.replace( /{/g, '{ ' )
					.replace( /}/g, ' }' );

				const pre = preventPrePost || this.question ? '' : '> ';
				const post = ( ! preventPrePost ) && this.question ? '\n> ' : '\n';
				process.stdout.write( pre + data + post, ()=>{} );

			} else {

				process.stdout.write( '\n', ()=>{} );

			}


		};

	}

	display() {

		this.question = true;
		this.readline.question( "> ", async ( cmd ) => {

			this.question = false;
			cmd = cmd.split( ' ' );

			if ( this.commandInterface.includes( cmd[ 0 ] ) ) {

				await this.commandInterface[ cmd[ 0 ] ]( cmd.slice( 1 ) );

			} else {

				console.log( "Unknown command " + cmd[ 0 ] + ". Type 'help' for a help menu." );

			}

			setTimeout( () => {

				this.display();

			}, 100 );

		} );

	}

	setup( config, cb ) {

		console.log( 'Setup' );
		console.log( `Please enter you email and the domain for the ssl certificate, and an optional homepage for redirection.` );
		console.log();

		this.readline.question( "email           ( email@example.com ): ", async ( res ) => {

			config.set( 'email', res );

			this.readline.question( "domain         ( example.domain.com ): ", async ( res ) => {

				config.set( 'domain', res );

				this.readline.question( "homepage: ( https://www.example.com ): ", async ( res ) => {

					config.set( 'homepage', res );
					console.log( 'Config saved' );
					cb();

				} );

			} );

		} );


	}

}
