/**
 * Created by Administrator on 2018/8/28.
 */
class Utils{
    constructor(){

    }
    invokeCallback(cb){
        if (typeof cb === 'function') {
            var len = arguments.length;
            if(len == 1) {
                return cb();
            }

            if(len == 2) {
                return cb(arguments[1]);
            }

            if(len == 3) {
                return cb(arguments[1], arguments[2]);
            }

            if(len == 4) {
                return cb(arguments[1], arguments[2], arguments[3]);
            }

            var args = Array(len - 1);
            for (i = 1; i < len; i++)
                args[i - 1] = arguments[i];
            cb.apply(null, args);
        }
    }
}


module.exports=Utils;
