import fs from 'fs';

export default class Config {

	constructor() {

		this.config = {};
		this.events = {};
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
    
	on( event, fn ) {
		this.events[ event ] = fn;        
	}

	load() {
        this.reload(true);
	}

    save() {
        fs.writeFileSync( __dirname + '/cluster.config.json', JSON.stringify( this.config, null, 2 ) );
	}

	reload( onLoad ) {
        if ( ! fs.existsSync( __dirname + '/cluster.config.json' ) ) {

			logErrorMessage( 'No cluster config provided! add cluster.config.json to root directory.' );

		} else {

			this.config = JSON.parse( fs.readFileSync( __dirname + '/cluster.config.json' ).toString() );
			if ( onLoad && this.events.load ) this.events.load();

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
