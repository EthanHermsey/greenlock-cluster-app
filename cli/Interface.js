export default class Interface {

	constructor( cli, cluster ) {

		this.cli = cli;
		this.cluster = cluster;
		this.commands = [
			'list',
			'set',
			'up',
			'down',
			'log',
			'quit',
			'help'
		];

	}

	includes( command ) {

		return this.commands.includes( command );

	}

	async list() {

		console.log();
		console.log( '          --= Greenlock Cluster Pods =--', true );
		Object.values( this.cluster.pods ).map( pod=>console.log( pod.status ) );
		console.log();

	}

	async set( [ name, port, autorestart ] ) {

		if ( typeof name != 'string' || ! parseInt( port ) || ! ( autorestart == 'true' || autorestart == 'false' ) ) {

			console.log( "Arguments provided to 'set' are not correct. It should be [name] [port] [autorestart]. For example 'set test 3000 true'" );
			return;

		}
		if ( ! this.cluster.pods[ name ] ) {

			console.log( `There was no directory found for pod ${name}. Make sure to add the project folder to ./pods first.` );
			return;

		}

		this.cluster.setPod( name, parseInt( port ), autorestart );

	}

	async up( [ name ] ) {

		if ( ! this.cluster.podExists( name ) ) return;
		Object.values( this.cluster.pods ).map( pod=>{

			if ( name == 'all' || name == pod.name ) pod.up();

		} );

	}

	async down( [ name ] ) {

		if ( ! this.cluster.podExists( name ) ) return;
		Object.values( this.cluster.pods ).map( pod=>{

			if ( name == 'all' || name == pod.name ) pod.down();

		} );

	}

	async log( [ name ] ) {

		if ( ! this.cluster.podExists( name ) ) return;

		console.log();
		Object.values( this.cluster.pods ).map( pod=>{

			if ( name == 'all' || name == pod.name ) {

				console.log( 'Logs for pod ' + pod.name + ':' );
				console.log( pod.log.split( '\n' ).map( t=>'    ' + t ).join( '\n' ) );
				console.log();

			}

		} );

	}

	async help() {

		console.log();
		console.log( '        --= Greenlock Cluster Help Menu =--', true );
		console.log( 'list                              - List all available pods and see their status' );
		console.log( 'set  [name] [port] [autorestart]  - set pod settings. [name] as string, [port] as number, [autorestart] as true/false' );
		console.log( 'up   [name*]                      - Start pod with name' );
		console.log( 'down [name*]                      - Stop pod with name' );
		console.log( 'log  [name*]                      - Show logs for pod with name' );
		console.log( 'help                              - Shows this menu' );
		console.log( 'quit                              - Exit cluster' );
		console.log();
		console.log( "* to select all pods, use 'all' as [name]" );
		console.log();

	}

	async quit() {

		this.cluster.quit();

	}

}
