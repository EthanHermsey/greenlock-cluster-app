
# greenlock-cluster-app

Greenlock-cluster-app is a tool for managing multiple node servers on one domain. 
The cluster uses greenlock-express to generate a SSL certificate, that is provided 
to each pod through ENV. Pods are accessible through their specified port.

Point a dynamic dns to your address. Install and start the app with your credentials and
you can start hosting your secure servers.

The cluster starts pods with the 'start' script specified in the pod's package.json. The 
pods have access to a few ENV variables; The SSL certificate's `process.env.CERT` and 
`process.env.PRIVKEY`, `process.env.PORT` to be used as the server port, and the 
`process.env.REPORT` hook, which is very important. It send a signal back to the cluster 
with the process id. When the pod is stopped the cluster can kill the process. 

After a restart of the cluster, pods that were previously online will automatically 
start up. When a pod crashes it will automatically be detected and stopped. The pod's
status will be set to crashed. It will only restart manually.

First time; It can take a few minutes for the ssl certificates to appear.



## Installation

`mkdir greenlock-cluster`

`cd greenlock-cluster`

`npm init -y`

`npm i git+https://github.com/EthanHermsey/greenlock-cluster-app.git`

`npx greenlock-cluster-app`


## Setup

### Fill in email, domain and homepage. 
The email and domain will be used to get a ssl certificate and the homepage 
will be use for redirection when someone navigates to the domain.

### Add pod
During setup a directory /pods will be created. You can add your node project
folder here, it will automatically show up in the cluster.
You can type 'list' to see all the pods.

### Set pod
Use the set command to set up a pod to specify the port it will use and if the pod
should auto-restart.

### Up pod
Use the up command to start the pod.


## Pod example
In the pod you will have access to:
- process.env.PORT
- process.env.PRIVKEY
- process.env.CERT
- process.env.REPORT

You have to add `eval( process.env.REPORT )()` to run the report hook. This is used to kill 
the process when the pod is stopped. When you forget to do this you will have to manually
kill the process in a taskmanager.

It also works with websocket and socket.io. The packages need to be installed first.

```
"use strict";
const https = require( 'https' );
const express = require( 'express' );

//GREENLOCK CLUSTER PID HOOK
eval( process.env.REPORT )();

const app = express();
app.use( "/", function ( req, res ) {

	res.setHeader( "Content-Type", "text/html; charset=utf-8" );
	res.end( "Hello, World!\n\n???? ????.js" );

} );

const server = https.createServer(
	{
		key: process.env.PRIVKEY,
		cert: process.env.CERT
	},
	app
).listen( process.env.PORT || 3000, () => {

		console.log( `TestServer: Listening on port: ${process.env.PORT || 3000}` );

} );

new ws.Server( { server: server, path: '/' } );
```


## Commands

- ### list                              
    List all available pods and see their status

- ### set  [ name ] [ port ] [ auto-restart ]  
    Set pod settings. [ name ] as string, [ port ] as number, [ auto-restart ] as true/false

- ### up   [ name ]                      
    Start pod with name. You can use 'all' to select all pods

- ### down [ name ]
    Stop pod with name. You can use 'all' to select all pods

- ### log  [ name ]                      
    Show logs for pod with name. You can use 'all' to select all pods

- ### help                              
    Shows the help menu.
    
- ### quit                              
    Exit cluster.

