/**
 * Created by Administrator on 2018/9/3.
 */
/**
 * 定时任务
 */

var Schedule=require('node-schedule');
var logger=require('pomelo-logger').getLogger('log', __filename, process.pid);
module.exports= function () {
    return new NodeSchedule();
};
class NodeSchedule{
    constructor(){
       logger.info("创建定时任务实例");
    }
    dayOfWeek(day,hour,minute){//每周的某天的某时刻0或者7为周日
        let rule = new Schedule.RecurrenceRule();
        rule.dayOfWeek=[];
        rule.dayOfWeek.push(day);
        rule.hour = hour;
        rule.minute = minute;
        var j = Schedule.scheduleJob(rule, function(){
            logger.info(`每周${day}的${hour}点${minute}分启动服务`);
        });
    }
    minuteOfHour(minute){//每小时的minute分钟
        let rule = new Schedule.RecurrenceRule();
        rule.minute =minute;
        var j = Schedule.scheduleJob(rule, function(){
            logger.info(`每小时第${minute}分钟启动服务`);
        });
    }
    exactTime(year,month,day,hour,minute,second){//准确时间点
        var date = new Date(year, month-1, day, hour, minute, second);
        var j = Schedule.scheduleJob(date, function(){
            logger.info(`${year}/${month}/${day}-${hour}:${minute}:${second}启动服务`);
            //取消预设计划
            j.cancel();
        });
    }
}
