/**
 * Created by Administrator on 2018/8/28.
 */
var Application = require('./application');

var MYN = module.exports = {};
var self=this;
MYN.createApp = function (opts) {
    var app = new Application();
    app.init(opts);
    self.app = app;
    return app;
};