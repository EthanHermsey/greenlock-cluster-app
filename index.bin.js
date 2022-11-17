#!/usr/bin/env node

"use strict";
import path from "path";
import Cluster from './cluster/Cluster.js';
import Config from './config/Config.js';


//setting up environment
console.log();
console.log( '             --= Greenlock Cluster =--' );
console.log();
process.title = 'Greenlock Cluster';
const pwd = path.resolve( './' );
global.__dir = {
	root: pwd,
	config: pwd + '/.greenlock-clusterrc',
	greenlock: pwd + '/greenlock.d',
	pods: pwd + '/pods',
	db: pwd + '/db'
};

//load config and cluster
const config = new Config();
const cluster = new Cluster( config );
config.load( ()=>cluster.setup() );
