
##Installation

`mkdir greenlock-cluster`

`cd greenlock-cluster`

`npm init -y`

`npm i greenlock-cluster-app`

`npx greenlock-cluster-app`


##Setup

#Fill in email, domain and homepage. 
The email and domain will be used to get a ssl certificate and the homepage 
will be use for redirection when someone navigates to the domain.

#Add pod
In the root directory a folder /pods has been created. You can copy your node
project folder, it will automatically show up in the cluster.
You can type 'list' to see all the 

#Set pod
Use the set command to set up a pod and specify the port and auto-restart.

#Up pod
Use the up command to start the pod.


##Pod example
You HAVE to use:
- process.env.PORT
- process.env.PRIVKEY
- process.env.CERT
- process.env.REPORT You have to eval and run report hook This is used to kill the process later.
When you forget to do this you will have to manually kill the process in 
a taskmanager.
It also works with websocket and socket.io, you of course will need to install 
the packages.

```
"use strict";

//GREENLOCK CLUSTER PID HOOK
eval(process.env.REPORT)();

import ws from 'ws';
import https from 'https';
import express from "express";

const app = express();
app.use("/", function(req, res) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("Hello, World!\n\n💚 🔒.js");
});

https.createServer(
    {
        key: process.env.PRIVKEY,
        cert: process.env.CERT
    }, 
    app
).listen( 
    process.env.PORT || 3000,
    () => {
        console.log( `TestServer: Listening on port: ${process.env.PORT || 3000}` );
    }
);

new ws.Server( { server: app, path: '/' } );
```


##Commands

list                              - List all available pods and see their status' );
set  [name] [port] [autorestart]  - set pod settings. [name] as string, [port] as number, [autorestart] as true/false' );
up   [name*]                      - Start pod with name' );
down [name*]                      - Stop pod with name' );
log  [name*]                      - Show logs for pod with name' );
help                              - Shows this menu' );
quit                              - Exit cluster' );
