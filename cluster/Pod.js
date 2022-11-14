import { exec } from 'node:child_process';

export default class Pod {

	constructor( config, certs ) {

		this.started = false;
		this.log = '';
		this.client = undefined;
		this.config = config;
		this.certs = certs;

	}

	get port() {

		return this.config.port;

	}

	get name() {

		return this.config.name;

	}

	get restart() {

		return this.config.restart;

	}

	up() {

		//create client
		this.client = exec(
			'node .',
			{ env: { ...process.env, PORT: this.port, PRIVKEY: this.certs.privkey, CERT: this.certs.cert }, cwd: __dirname + `/pods/${this.name}/` }
		);

		//log stdout, intercept pid report
		this.client.stdout.on( 'data', ( data ) => {

			const msg = data.toString();
			if ( msg.includes( '#PID' ) ) {

				this.client.childPid = msg.replace( '#PID:', '' );

			} else {

				this.log += msg;

			}

		} );

		//handle exit and errors
		this.client.on( 'exit', ( code )=>{

			console.log( `> Pod ${this.name} exited${ code ? ' with error code ' + code : ''}.` );
			this.restart();

		} );
		this.client.on( 'error', ( err )=>{

			console.log( `> Pod ${this.name} gave an error: ${err ? err : ''}` );
			this.restart();

		} );

		//set started
		this.started = true;
		console.log( `> Pod ${this.name} is listening on port ${this.port}` );

	}

	down() {

		if ( this.client ) {

			if ( this.client.childPid ) process.kill( this.client.childPid );
			this.client.kill( 'SIGTERM' );
			this.log += `Pod ${this.name} stopped.\n`;

		}
		this.client = undefined;
		this.started = false;

	}

	restart() {

		if ( this.started && this.restart ) {

			console.log( `> Restarting pod ${this.name}.` );
			this.down();
			this.up();

		} else {

			this.down();

		}

	}

}
