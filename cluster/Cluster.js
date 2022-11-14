import e from 'express';
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
        this.readline.on("SIGINT", ()=>this.quit());

        this.commands = [
            'list',
            'reload',
            'up',
            'down',
            'add',
            'remove',
            'log',
            'quit',
            'help'
        ];

    }

    loadConfig(){
        if ( !fs.existsSync(__dirname + '/cluster.config.json')){
            logErrorMessage('No cluster config provided! add cluster.config.json to root directory.');
            return {};
        }
        this.config = JSON.parse(fs.readFileSync(__dirname + '/cluster.config.json').toString()); 
    }

    saveConfig(){
        fs.writeFileSync(__dirname + '/cluster.config.json', JSON.stringify(this.config, null, 2));
    }

    loadPodsFromConfig(){
        this.config.servers.map( server => { 
            if ( !this.pods[server.name] ) this.pods[server.name] = new Pod(server, this.certs);
        } );
    }

    addPodToConfig( pod ){
        pod.restart = (pod.restart == 'true') ? true : false;
        this.config.servers.push(pod);
        this.saveConfig();
    }

    removePodFromConfig( name ){
        this.pods[name].down();
        delete this.pods[name];
        this.config.servers = this.config.servers.filter(server=>server.name != name);
        this.saveConfig();
    }
    
    podExists(name){
        if ( name == 'all' || this.pods[name] ){
            return true;
        } else if ( name == undefined ){
            console.log("> Pod name not provided. Add pod name or 'all' to the command.");
        } else {
            console.log('> Pod with name ' + name + ' could not be found.');
        }
        return false;
    }
    
    init(i = 300){

        const isPrivkey = fs.existsSync(`./greenlock/live/${this.config.domain}/privkey.pem`);
        const isCert = fs.existsSync(`./greenlock/live/${this.config.domain}/cert.pem`);

        if ( isPrivkey && isCert ){

            this.certs = {
                privkey: fs.readFileSync(`./greenlock/live/${this.config.domain}/privkey.pem`).toString(),
                cert: fs.readFileSync(`./greenlock/live/${this.config.domain}/cert.pem`).toString()
            };

            this.start();

        } else {
            
            if ( i <= 0 ) {
                logErrorMessage("The certificates seem to be missing.. We've been looking for 30 seconds in ./greenlock/live/basis64.ddns.net/...");
                return;
            }
            setTimeout(()=>this.init(i - 1), 100);

        }

    }

    start(){
        console.log('');
        console.log('Greenlock Cluster');
        console.log('');

        this.loadPodsFromConfig();
        setTimeout(() => this.display(), 500);
    }

    display(){
        this.readline.question( "> ", async ( cmd ) => {
            
            cmd = cmd.split(' ');
            if ( this.commands.includes(cmd[0]) ){
                await this[cmd[0]]( cmd.slice(1) );
            } else {
                console.log("> Unknown command. Type 'help' for a help menu.");
            }

            setTimeout(() => {
                this.display();
            }, 100);

        });
    }


    async list(){
        Object.values(this.pods).map(pod=>{
            console.log(`> Pod ${pod.name} is ${pod.started ? `online on port ${pod.port}` : 'offline'}`);
        });
    }

    async reload(){
        this.loadConfig();
        this.loadPodsFromConfig();
    }

    async add([name, port, restart]){
        if ( typeof name != 'string' || !parseInt(port) || !(restart == 'true' || restart == 'false')){
            console.log("> Arguments provided to 'add' are not correct. It should be [name] [port] [restart]. For example 'add test 3000 true'");
            return;
        }
        this.addPodToConfig({name, port, restart});
        this.loadPodsFromConfig();
        console.log('> Succesfully added pod ' + name);
    }

    async remove([name]){
        if ( !this.podExists(name) ) return;

        const confirm = new Promise((resolve,_)=>{
            this.readline.question( `> This action will remove pod ${name}, are you sure? [Y/n]: `, ( cmd ) => {
                cmd = cmd || 'y';
                if ( cmd == 'y' || cmd == 'Y'){
                    this.removePodFromConfig(name);                    
                    console.log('> Succesfully removed pod ' + name);
                } else {
                    console.log('> Did not remove pod ' + name);
                }
                resolve();
            });
        });
        await confirm;      
    }

    async up([name]){
        if ( !this.podExists(name) ) return;
        Object.values(this.pods).map(pod=>{
            if ( name == 'all'|| name == pod.name) pod.up();
        });
    }
    
    async down([name]){
        if ( !this.podExists(name) ) return;
        Object.values(this.pods).map(pod=>{
            if ( name == 'all'|| name == pod.name) pod.down();
        });
    }
    
    async log([name]){
        if ( !this.podExists(name) ) return;
        Object.values(this.pods).map(pod=>{
            if ( name == 'all'|| name == pod.name){
                console.log('> Logs for pod ' + pod.name + ':');
                console.log( pod.log.split('\n').map(t=>'    '+t).join('\n') );
            }
        });
    }

    async help(){
        console.log('> Greenlock Cluster Help Menu');
        console.log();                   
        console.log('list                         - List all available pods and see their status');
        console.log('reload                       - Reload pods from config (existing pods will persist)');
        console.log('up [name]                    - Start pod with name*');
        console.log('down [name]                  - Stop pod with name*');
        console.log('add [name] [port] [restart]  - Add a pod. [name] as string, [port] as number, [restart] as true/false');
        console.log('remove [name]                - Remove a pod');
        console.log('log [name]                   - Show logs for pod with name*');
        console.log('quit                         - Exit cluster');
        console.log('help                         - Shows this menu');
        console.log();                   
        console.log("* to select all pods, use 'all' as [name]");
        console.log();                   
    }

    async quit(){
        console.log('\n> Stopping cluster...');
        this.down('all');

        console.log('Exited greenlock cluster.');
        process.exit(0);
    }

}


