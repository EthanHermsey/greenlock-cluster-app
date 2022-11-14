//"use strict";

import fs from 'fs';
import path  from "path";
import express from "express";
import greenlock from "greenlock-express";
import Cluster from './cluster/Cluster.js';

//setting up environment
process.title = 'Greenlock Cluster';
global.__dirname = path.resolve('./');
global.logErrorMessage = msg =>{
    const repeat = (chr,t)=>new Array(t).fill(chr).join('');
    console.log('');
    console.log(repeat('#', msg.length + 8));
    console.log(`##  ${msg}  ##`);
    console.log(repeat('#', msg.length + 8));
    console.log('');
}

//load config
let config = {};
if ( !fs.existsSync(__dirname + '/cluster.config.json')){
    logErrorMessage('No cluster config provided! add cluster.config.json to root directory.');                
} else {
    config = JSON.parse(fs.readFileSync(__dirname + '/cluster.config.json').toString()); 
}

//create greenlock-express app
const app = express();
app.use("/", function(_, res) {
    res.redirect(301, config.homepage );
});

//activate greenlock
greenlock
.init({
    packageRoot: __dirname,
    configDir: "./greenlock",
    maintainerEmail: "basis64@hotmail.com",
    cluster: false
})
.serve(app);

//initialize cluster
const cluster = new Cluster();
cluster.init();
