import fs from 'fs';
import { exec } from 'node:child_process';

export default class Pod {

	constructor( name, certs ) {

		this.client = undefined;
		this.certs = certs;

		this.name = name;
		this.port = undefined;
		this.started = false;
		this.autorestart = false;
		this.log = '';

		this.crashDetection = [];
		this.hasCrashed = false;
		this.crashThresholdMs = 1000;

		this.loadDb();

	}

	get status() {

		if ( this.port ) {

			return `Pod [ ${this.name} ] is ${this.hasCrashed ? 'CRASHED' : this.started ? `ONLINE` : 'OFFLINE'} port:${this.port} restart:${this.autorestart}`;

		} else {

			return `Pod [ ${this.name} ] has not been set up.`;

		}

	}
	set( port, autorestart ) {

		this.port = port;
		this.autorestart = autorestart;
		this.saveDb();
		console.log( `Succesfully set pod. name:${this.name}, port:${port}, auto-restart:${autorestart}` );

	}

	loadDb() {

		if ( fs.existsSync( `${__dir.db}/${this.name}.json` ) ) {

			fs.readFile( `${__dir.db}/${this.name}.json`, ( _, data )=>{

				const db = JSON.parse( data.toString() );
				this.name = db.name;
				this.autorestart = db.autorestart;
				this.port = db.port;
				this.log = db.log;
				this.hasCrashed = db.hasCrashed;

				if ( db.started && ! this.started && ! db.hasCrashed ) setTimeout( ()=>this.up( true ), 200 );

			} );

		}


	}

	saveDb() {

		fs.writeFileSync( `${__dir.db}/${this.name}.json`, JSON.stringify( {
			name: this.name,
			started: this.started,
			autorestart: this.autorestart,
			port: this.port,
			log: this.log,
			hasCrashed: this.hasCrashed
		} ) );

	}

	up( silent ) {

		if ( this.started ) {

			console.log( `Pod [ ${this.name} ] is already ONLINE` );
			return;

		}

		if ( this.hasCrashed ) {

			//reset
			this.crashDetection.length = 0;
			this.hasCrashed = false;

		}


		//create client
		this.client = exec(
			'node .',
			{
				env: {
					...process.env,
					PORT: this.port,
					PRIVKEY: this.certs.privkey,
					CERT: this.certs.cert,
					REPORT: `()=>console.log( '#GL:PID' + process.pid )`
				},
				cwd: `${__dir.pods}/${this.name}/`
			}
		);

		//log stdout, intercept pid report
		this.client.stdout.on( 'data', ( data ) => {

			const msg = data.toString();
			if ( msg.includes( '#GL:PID' ) ) {

				this.childPid = msg.replace( '#GL:PID', '' );

			} else {

				this.log += msg;
				this.saveDb();

			}

		} );

		//handle exit and errors
		this.client.on( 'exit', ( code )=>{

			console.log( `Pod [ ${this.name} ] stopped${ code ? ' with error code ' + code : ''}` );
			this.restart();

		} );
		this.client.on( 'error', ( err )=>{

			console.log( `Pod [ ${this.name} ] gave an error: ${err ? err : ''}` );
			this.restart();

		} );

		//set started
		this.started = true;
		if ( ! silent ) console.log( `Pod [ ${this.name} ] is listening on port ${this.port}` );
		this.saveDb();

	}

	down( quiting ) {

		if ( ! this.started ) {

			if ( ! quiting ) console.log( `Pod [ ${this.name} ] is already OFFLINE` );
			return;

		}

		if ( this.client ) {

			try {

				if ( this.childPid ) process.kill( this.childPid );

			} catch ( error ) {

				console.log( `Child process has already stopped, or you have to add 'eval(process.env.REPORT)()' to the pod.` );

			}
			this.client.kill( 'SIGTERM' );
			this.log += `Pod [ ${this.name} ] stopped.\n`;

		}
		this.client = undefined;
		this.started = false;
		if ( ! quiting ) this.saveDb();

	}

	restart() {

		if ( this.started && this.autorestart ) {

			if ( this.crashed() ) {

				this.hasCrashed = true;
				this.down();
				console.log( `Pod [ ${this.name} ] keeps restarting in short periods. Status is set to CRASHED` );

			} else {

				console.log( `Restarting pod [ ${this.name} ]` );
				this.log += `Restarting Pod [ ${this.name} ]\n`;

				this.down();
				this.up();

			}


		} else {

			this.down();

		}

	}

	crashed() {

		this.crashDetection.push( new Date().getTime() );

		if ( this.crashDetection.length > 5 ) {

			this.crashDetection.shift();

			let total_delta = 0;
			for ( let i = 1; i < 5; i ++ ) {

				const t = this.crashDetection[ i ];
				const tP = this.crashDetection[ i - 1 ];
				total_delta += t - tP;

			}

			if ( total_delta / 5 < this.crashThresholdMs ) return true;

		}

		return false;

	}

}
