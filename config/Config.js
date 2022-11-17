import fs from 'fs';

export default class Config {

	constructor() {

		this._config = { email: '', domain: '', homepage: '', pods: [] };
		this.noConfig = false;
		this.fillable = [
			'email',
			'homepage',
			'domain',
			'pods'
		];

	}

	get email() {

		return this._config.email;

	}
	get homepage() {

		return this._config.homepage;

	}
	get domain() {

		return this._config.domain;

	}
	get pods() {

		return this._config.pods;

	}

	set( propery, value ) {

		if ( ! this.fillable.includes( propery ) ) {

			console.log( `> Error saving config. Property ${property} is not editable.` );
			return;

		}
		this._config[ propery ] = value;
		this.save();

	}

	load( cb ) {

		this.reload();
		if ( cb ) cb();

	}

	save() {

		fs.writeFileSync( __dir.config, JSON.stringify( { ...this._config, pods: undefined } ) );

	}

	reload() {

		if ( fs.existsSync( __dir.config ) )
			this._config = JSON.parse( fs.readFileSync( __dir.config ).toString() );
		else
			this.noConfig = true;

		//load files in directory pods
		if ( fs.existsSync( __dir.pods ) ) {

			this._config.pods = fs.readdirSync( __dir.pods );

		}

	}

}
