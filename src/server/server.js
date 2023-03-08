"use strict";
exports.__esModule = true;
var express_1 = require("express");
var path_1 = require("path");
var http_1 = require("http");
var port = 3000;
var App = /** @class */ (function () {
    function App(port) {
        this.port = port;
        var app = (0, express_1["default"])();
        app.use(express_1["default"].static(path_1["default"].join(__dirname, '../client')));
        // In the webpack version of the boilerplate, it is not necessary 
        // to add static references to the libs in node_modules if 
        // you are using module specifiers in your client.ts imports. 
        //
        // Visit https://sbcode.net/threejs/module-specifiers/ for info about module specifiers
        //
        // This server.ts is only useful if you are running this on a production server or you
        // want to see how the production version of bundle.js works
        // 
        // to use this server.ts
        // # npm run build        (this creates the production version of bundle.js and places it in ./dist/client/)
        // # tsc -p ./src/server  (this compiles ./src/server/server.ts into ./dist/server/server.js)
        // # npm start            (this starts nodejs with express and serves the ./dist/client folder)
        // 
        // visit http://127.0.0.1:3000
        this.server = new http_1["default"].Server(app);
    }
    App.prototype.Start = function () {
        var _this = this;
        this.server.listen(this.port, function () {
            console.log("Server listening on port ".concat(_this.port, "."));
        });
    };
    return App;
}());
new App(port).Start();
