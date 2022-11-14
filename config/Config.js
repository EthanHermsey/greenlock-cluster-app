import fs from 'fs';

export default class Config {

	constructor() {

		this.config = {};
        this.fillable = [
            'email',
            'homepage',
            'domain',
            'pods'
        ];

	}

    get email(){
        return this.config?.email;
    }
    get homepage(){
        return this.config?.homepage;    
    }
    get domain(){
        return this.config?.domain;
    }
    get pods(){
        return this.config?.pods;
    }
    
	load( cb ) {
        const success = this.reload();
        if ( success && cb ) cb();
	}

    save() {
        fs.writeFileSync( __dirname + '/cluster.config.json', JSON.stringify( this.config, null, 2 ) );
	}

	reload() {
        if ( ! fs.existsSync( __dirname + '/cluster.config.json' ) ) {

			logErrorMessage( 'No cluster config provided! add cluster.config.json to root directory.' );
            return false;

		} else {

			this.config = JSON.parse( fs.readFileSync( __dirname + '/cluster.config.json' ).toString() );
			return true;

		}
	}

	set(propery, value) {
        if ( !this.fillable.includes(propery)){
            console.log(`> Error saving config. Property ${property} is not editable.`);
            return;
        }
        this.config[propery] = value;
        this.save();
	}	

}
