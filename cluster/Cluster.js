import fs from 'fs';
import readline from 'readline';
import Pod from './Pod.js';

export default class Cluster{

    constructor( config ){
        
        this.config = {};
        this.loadConfig();

        this.pods = {};
        this.certs = {};

        this.readline = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });        
        this.readline.on("SIGINT", ()=>this.exit());

    }

    loadConfig(){
        if ( !fs.existsSync(__dirname + '/cluster.config.json')){
            logErrorMessage('No cluster config provided! add cluster.config.json to root directory.');
            return {};
        }
        this.config = JSON.parse(fs.readFileSync(__dirname + '/cluster.config.json').toString()); 
    }

    
    init = (i = 3000)=>{

        const isPrivkey = fs.existsSync(`./greenlock/live/${this.config.domain}/privkey.pem`);
        const isCert = fs.existsSync(`./greenlock/live/${this.config.domain}/cert.pem`);

        if ( isPrivkey && isCert ){

            this.certs = {
                privkey: fs.readFileSync(`./greenlock/live/${this.config.domain}/privkey.pem`).toString(),
                cert: fs.readFileSync(`./greenlock/live/${this.config.domain}/cert.pem`).toString()
            };

            this.loadPodsFromConfig();

            setTimeout(() => {
                console.log('');
                console.log('Greenlock Cluster');
                console.log('');
                this.display();                       
            }, 1000);

        } else {
            
            if ( i <= 0 ) {
                logErrorMessage("The certificates seem to be missing.. We've been looking for 30 seconds in ./greenlock/live/basis64.ddns.net/...");
                return;
            }
            setTimeout(()=>this.loadCerts(i - 1), 100);

        }

    }

    loadPodsFromConfig(){

        this.config.servers.map( config => {

            if ( !this.pods[config.name] ) this.pods[config.name] = new Pod(config, this.certs);

        } );

    }

    reload(){
        this.loadConfig();
        this.loadPodsFromConfig();
    }

    podExists(name){
        if ( name == 'all' || this.pods[name] ) return true;
        console.log('> Pod with name ' + name + ' could not be found.');
        return false;
    }

    up( name = 'all'){
        if ( !this.podExists(name) ) return;
        Object.values(this.pods).map(pod=>{
            if ( name == 'all'|| name == pod.name) pod.up()
        });
    }
    
    down( name = 'all' ){
        if ( !this.podExists(name) ) return;
        Object.values(this.pods).map(pod=>{
            if ( name == 'all'|| name == pod.name) pod.down()
        });
    }
    
    log( name ){
        if ( !this.podExists(name) ) return;
        Object.values(this.pods).map(pod=>{
            if ( name == 'all'|| name == pod.name){
                console.log('> Logs for pod ' + pod.name + ':');
                console.log( pod.log.split('\n').map(t=>'    '+t).join('\n') );
            }
        });
    }

    help(){
        console.log('> Greenlock Cluster Help Menu');
        console.log();                   
        console.log('list          - list all available pods and see their status.');
        console.log('up [name]     - start pod with name*');
        console.log('down [name]   - stop pod with name*');
        console.log('log [name]    - show logs for pod with name*');
        console.log('quit          - exit cluster');
        console.log();                   
        console.log("* to select all use 'all' as [name]");
        console.log();                   
    }

    exit(){
        console.log('\n> Stopping cluster...');
        this.down('all');

        console.log('Exited greenlock cluster.');
        process.exit(0);
    }

    display(){
        this.readline.question( "> ", ( cmd ) => {
            
            cmd = cmd.split(' ');
            switch( cmd[0] ){

                case 'quit':
                    this.exit();
                    break;

                case 'up':
                    this.up( cmd[1] );
                    break;    
                
                case 'down':
                    this.down( cmd[1] );
                    break;    
                    
                case 'log':
                    this.log( cmd[1] );
                    break;    

                case 'help':
                    this.help();
                    break;                    
                    
                case 'list':
                    Object.values(this.pods).map(pod=>console.log(`> Pod ${pod.name} is ${pod.started ? `online on port ${pod.port}` : 'offline'}`))
                    break;    
            }

            setTimeout(() => {
                this.display();
            }, 100);

        });
    }

}


