# greenlock-cluster-app
A greenlock cluster that enables you to manage multiple node servers on one domain. 
It uses greenlock to provide SSL certificates that the cluster shares the 
certificates through `process.env` with it's pods.
Point a dynamic dns to your address, install and start the app with your credentials.
Now you can start hosting your servers.

Servers are accessible through example.domain.com:3000. Pods are expected to contain
a 'start' script in the package.json and use `process.env.PORT` as the server port. 
Check out the example below.

After a restart of the cluster, pods that were previously online will automatically 
start up. When a pod crashes it will automatically be detected and stopped. The pod's
status will be set to crashed. It will only restart manually.

The cluster's pods will have access to a few env variables. The report hook is a very
important one. It send a signal back to the cluster with the process id. When the 
pod is stopped the cluster can kill the process, so don't forget it!

First time; It can take a few minutes for the ssl certs to come in.



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
In the root directory a folder /pods has been created. You can copy your node
project folder, it will automatically show up in the cluster.
You can type 'list' to see all the pods.

### Set pod
Use the set command to set up a pod to specify the port and auto-restart.

### Up pod
Use the up command to start the pod.


## Pod example
In the pod you will have access to:
- process.env.PORT
- process.env.PRIVKEY
- process.env.CERT
- process.env.REPORT

You have to eval and run report hook. This is used to kill the process later.
When you forget to do this you will have to manually kill the process in 
a taskmanager.

It also works with websocket and socket.io, you of course will need to install 
the packages.

```
"use strict";
const https = require( 'https' );
const express = require( 'express' );

//GREENLOCK CLUSTER PID HOOK
eval( process.env.REPORT )();

const app = express();
app.use( "/", function ( req, res ) {

	res.setHeader( "Content-Type", "text/html; charset=utf-8" );
	res.end( "Hello, World!\n\n💚 🔒.js" );

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

- ### set  [name] [port] [autorestart]  
    set pod settings. [name] as string, [port] as number, [autorestart] as true/false

- ### up   [name*]                      
    Start pod with name

- ### down [name*]                      
    Stop pod with name

- ### log  [name*]                      
    Show logs for pod with name

- ### help                              
    Shows this menu
    
- ### quit                              
    Exit cluster


you can use 'all' to select all pods
