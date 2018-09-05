/**
 * Created by Administrator on 2018/8/27.
 */
var express = require('express');
var Token = require('mynapi/util/token');
var BSM_Router=require('./router/BSM.js');
var bodyParser=require('body-parser');
var app = express();
var mysql = require('./dao/mysql/mysql');
var session=require('express-session');
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
var publicPath = __dirname +  '/public';
var Schedule=require('../shared/MYN/util/schedule');
var Session=require('../shared/MYN/config/session');

app.use(bodyParser.json({limit: '1mb'}));  //body-parser 解析json格式数据
app.use(bodyParser.urlencoded({            //此项必须在 bodyParser.json 下面,为参数编码
    extended: true
}));

app.use(session({
    secret:Session.secret,
    cookie:{maxAge:60*1000}
}));//配置session

app.use(express.static(publicPath));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('view options', {layout: false});

app.all("*", function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.setHeader("X-Powered-By",' 3.2.1');
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    next();
});



app.use("/BSM",BSM_Router);



app.listen(3001, function () {
    //Init mysql
    mysql.init();
    let schedule=Schedule();//开启定时任务
    // schedule.dayOfWeek(0,23,0);//每周日的23:00
    //schedule.minuteOfHour(15);//每小时的某分钟
    //schedule.exactTime(2018,9,3,11,21,0);//准确时间定时
    process.env.LOGGER_LINE = true;//调试模式
    //process.env.RAW_MESSAGE = true;
    logger.info("数据库池已经初始化成功");
    //console.log();
    logger.info("Web server has started.\n Please log on http://127.0.0.1:3001/");

});

process.on('uncaughtException', function(err) {
    logger.error(' Caught exception: ' + err.stack);
});