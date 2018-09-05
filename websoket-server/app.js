/**
 * Created by Administrator on 2018/8/28.
 */
var MYN=require('../shared/MYN/MYN.js');
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
var app=MYN.createApp();

app.start(function (result) {
    //console.log("app start:",result)
});


// Uncaught exception handler
process.on('uncaughtException', function(err) {
    logger.error(' Caught exception: ' + err.stack);
});