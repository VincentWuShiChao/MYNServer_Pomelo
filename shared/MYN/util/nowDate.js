/**
 * Created by Administrator on 2018/9/3.
 */

/**
 * 时间格式化
 *
 */
module.exports= function(type) {

    let date=new Date();
    let YEAR=date.getFullYear();
    let MONTH=date.getMonth()+1;
    let DAY=date.getDate();
    let HOUR=date.getHours();
    let MINUTE=date.getMinutes();
    let SECOND=date.getSeconds();
    if(String(MONTH).length<2){
        MONTH=`0${MONTH}`;
    }
    if(String(DAY).length<2){
        DAY=`0${DAY}`;
    }
    if(String(HOUR).length<2){
        HOUR=`0${HOUR}`;
    }
    if(String(MINUTE).length<2){
        MINUTE=`0${MINUTE}`;
    }
    if(String(SECOND).length<2){
        SECOND=`0${SECOND}`;
    }
    let nowTime="default";

    if(type===0){
        nowTime=`${YEAR}${MONTH}${DAY}${HOUR}${MINUTE}${SECOND}`;

    }else if(type===1){
        nowTime=`${YEAR}${MONTH}${DAY}`;
    }
    return nowTime;
}
