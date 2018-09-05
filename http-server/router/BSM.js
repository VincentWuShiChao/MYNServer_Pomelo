/**
 * Created by Administrator on 2018/8/28.
 */
var express=require('express');
var router=express.Router();
var adminUser=require('../config/adminUser.json');
var LogJs=require('../utils/LogJs');
var nowTime=require('mynapi/util/nowDate');
var session_user=[];
var logJs=new LogJs();
var IpParse=require('mynapi/util/IpParse');
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
var jsonFile=require('jsonfile');
var fs=require('fs');
var lineReader=require("line-reader");
var path=require('path');
var tokenService=require('../../shared/MYN/util/token');
var Session=require('../../shared/MYN/config/session');
function ExistUser(name){//检查用户是否还存在
    let existUser=false;
    session_user.forEach(function (session) {
        if(session.username===name){
            existUser=true;
        }
    });
    return new Promise(function (resolve,reject) {
        if(existUser===true){
            resolve(existUser);
        }else {
            reject(existUser);
        }
    });
}

router.get("/Login", function (req,res) {
    res.render('index',{code:200,msg:"初始化页面",tag:0});
});
router.post("/Main", function (req,res) {
    console.log(req.body);
    let name=req.body.name;
    let password=req.body.password;
    let hasUser=false;
    adminUser.forEach(function (admin) {
        if(admin.username===name){
            hasUser=true;
            if(admin.password===password){
                let date=nowTime(1);
                logJs.setConfig("login",date+"_adminLogin")
                    .then(function (content) {
                        if(content.tag){
                            //console.log("日志配置设置成功-123:",content.content);
                            let data={
                                adminName:name
                            };
                            data.loginTime=new Date().getHours()+":"+new Date().getMinutes();
                            let ipParse=new IpParse(req);
                            let userIp=ipParse.getClientIp();
                            ipParse.parseIpByTaoBao(userIp,function (result) {
                                data.ipAddr=result;
                                let logger=logJs.useLogger(date+"_adminLogin");
                                logJs.createLog(logger,JSON.stringify(data));
                            });
                        }
                    });
                session_user.push(admin);
                res.send({code:200,msg:"进入到主页面",tag:1,user:{name:name,level:admin.level}});
            }else {
                res.send({code:500,msg:"用户密码不正确",tag:-1});
            }
        }
    });
    if(hasUser===false){
        res.send({code:500,msg:"该用户不存在",tag:-1});
    }

});
//首页的显示
router.get("/ShowMain", function (req,res) {
    let name=req.query.name;
    let level=req.query.level;
    ExistUser(name).then(function (resolve) {
        let user={
            name:name,
            level:level
        };
        //获取总用户的信息
        var file='./config/default.json';
        let data=jsonFile.readFileSync(file);
        req.session.userInfo=user;
        req.session.secret=Session.secret;
        let token=tokenService.create(name,new Date().getTime(),Session.secret);
        req.session.token=token;
        res.render("main-page",{userInfo:req.session.userInfo,userCount:data.UserCount,userPay:data.UserPay});
    }, function (reject) {
        res.render("index",{code:200,msg:"初始化页面",tag:0})
    })
});
router.all("*", function (req,res,next) {
    let info=tokenService.parse(req.session.token,req.session.secret);
    console.log(info);
    if(req.session.userInfo){
        logger.info("存在用户的session");
        next();
    }else {
        logger.warn("走到开始的拦截");
        res.render("index",{code:200,msg:"初始化页面",tag:0});
    }
});
//首页数据的显示
router.get("/GetDefault", function (req,res) {
    var file='./config/default.json';
    let data=jsonFile.readFileSync(file);
    res.json(data.YearFlow);
});

//登录日志列表的显示
router.get("/LoginList", function (req,res) {
    let page=req.query["page"];
    let index=req.query["index"];
    var files=getFileList("./logs/login/");
    var fileNames=[];

    for(let i=0;i<files.length;i++){
        fileNames.push(files[i].filename);
    }
    logger.debug(fileNames);
    getDataByPage(page,fileNames[index],function (result,allPage) {
        res.render("LoginList",{userInfo:req.session.userInfo,users:result,pages:{page:page,allPage:allPage,index:index},logs:fileNames,fileName:fileNames[index]});
    });

});
//登录数据显示
router.get("/LoginData", function (req,res) {
    var files=getFileList("./logs/login/");
    var fileNames=[];
    let index=req.query["index"];
    for(let i=0;i<files.length;i++){
        fileNames.push(files[i].filename);
    }
    res.render("LoginData",{userInfo:req.session.userInfo,logs:fileNames,fileName:fileNames[index]});
});

router.get("/Typo", function (req,res) {
    res.render("typo",{userInfo:req.session.userInfo});
});
router.get("/Input", function (req,res) {
    res.render("input",{userInfo:req.session.userInfo});
});
router.get("/Tables", function (req,res) {
    res.render("table",{userInfo:req.session.userInfo});
});

function getDataByPage(page,fileName,cb){
    let list=[];
    var limitPage=10;
    lineReader.eachLine(path.join("./logs/login",fileName), function (line,last) {
        //console.log(typeof line);
        list.push(JSON.parse(line));
        if(last){
            logger.debug("i am done");
            hander(list)
                .then(function (result) {
                    /*let file='./config/login.json';
                     jsonFile.writeFileSync(file,result);*/
                    logger.info("总人数:",result.length);
                    let allPage=Math.ceil(result.length/limitPage);
                    if(page<=0){
                        page=1;
                    }
                    if(page>allPage){
                        page=allPage;
                    }
                    var skip=page-1;
                    let return_list=[];
                    let index=skip*limitPage;
                    let last=index+10;
                    if(last>result.length){
                        last=result.length;
                    }
                    if(index>result.length-1){
                        result=[];
                    }
                    for(let i=index;i<last;i++){
                        return_list.push(result[i]);
                    }
                    logger.info("返回的人数：",return_list.length);
                    cb(return_list,allPage);
                });
        }
    });
}
function hander(list) {//处理log文件里面的json内容
    var table=[];
    let timeList=[];
    list.forEach(function (each) {
        var tag = false;
        var u_tag;
        for (var i = 0; i < table.length; i++) {
            if (each.adminName == table[i].adminName) {
                tag = true;
                table[i].timeList.push(each.loginTime);
                u_tag = i;
                break;
            }
        }
        if (tag == false) {
            each.count = 1;
            each.timeList=[];
            each.lastTime=each.loginTime;
            table.push(each);
        } else {
            table[u_tag].lastTime=table[u_tag].timeList[table[u_tag].timeList.length-1];
            table[u_tag].count += 1;
        }
    });
    return new Promise(function (resolve,reject) {
        resolve(table);
    });
}
//获取文件夹下的所有文件
function getFileList(path) {
    var filesList = [];
    readFileList(path, filesList);
    return filesList;
}
function readFileList(path, filesList) {
    var files = fs.readdirSync(path);
    files.forEach(function (itm, index) {
        var stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + itm + "/", filesList)
        } else {
            var obj = {};//定义一个对象存放文件的路径和名字
            obj.path = '../logs/';//路径
            obj.filename = itm;//名字
            filesList.push(obj);
        }
    })
}
module.exports=router;