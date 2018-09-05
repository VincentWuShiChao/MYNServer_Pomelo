// mysql CRUD
var sqlclient = module.exports;

var _pool = null;

var NND = {};

/*
 * Innit sql connection pool
 * @param {Object} app The app for the server.
 */
NND.init = function(){
	if(!_pool)
		_pool = require('./dao-pool').createMysqlPool();
};

/**
 * Excute sql statement
 * @param {String} sql Statement The sql need to excute.
 * @param {Object} args The args for the sql.
 * @param {fuction} callback Callback function.
 * 
 */
NND.query = function(sql, args, callback){


	var promise=_pool.acquire();
	promise.then(function (client) {
		client.query(sql,args, function (error,results,fields) {
			if(error){
				_pool.destroy(client);
				callback(error,results);
			}else{
				_pool.release(client);
				callback(error,results);
			}
		})
	}, function () {
		console.log("reject");
	}).catch(function (err) {
		callback(err);
		console.log(err);
	})
};

/**
 * Close connection pool.
 */
NND.shutdown = function(){
	_pool.drain().then(function () {
		_pool.clear();
	});
};

/**
 * init database
 */
sqlclient.init = function() {
	if (!!_pool){
		return sqlclient;
	} else {
		NND.init();
		sqlclient.insert = NND.query;
		sqlclient.update = NND.query;
		//sqlclient.delete = NND.query;
		sqlclient.query = NND.query;
    return sqlclient;
	}
};

/**
 * shutdown database
 */
sqlclient.shutdown = function() {
	NND.shutdown();
};






