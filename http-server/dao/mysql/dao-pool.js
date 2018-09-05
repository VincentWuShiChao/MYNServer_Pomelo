var _poolModule = require('generic-pool');
var mysql = require('mysql');
var mysqlConfig=require('./mysql');
/*
 * Create mysql connection pool.
 */
var createMysqlPool = function(){
	const factory={
		create: function () {
			return new Promise(function(resolve,reject){
				var client=mysql.createConnection({
					host:mysqlConfig.mynserver.host,
					user:mysqlConfig.mynserver.user,
					password:mysqlConfig.mynserver.password,
					database:mysqlConfig.mynserver.database
				});
				client.on("error", function () {
					client.connect();
				});
				client.connect(function (error) {
					if(error){
						console.log('sql connect error');
						console.log(error);
					}
					resolve(client);
				});
			})
		},
		destroy: function (client) {
			return new Promise(function (resolve) {
				client.on("end", function () {
					resolve();
				});
				client.end();
			});
		}
	};
	var opts={
		max:10,
		min:2,
		idleTimeoutMillis:30000,
		log:false
	};
	return _poolModule.createPool(factory,opts);
};

exports.createMysqlPool = createMysqlPool;
