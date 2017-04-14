/// <reference path="notificationshubclient.ts" />
/// <reference path="../typefiles/moment.d.ts" />
"use strict";
var Vue = require("vue");
var Morph;
(function (Morph) {
    var WebClient;
    (function (WebClient) {
        var incomingBuffer = new Array();
        var ServerLogViewModel = (function () {
            function ServerLogViewModel() {
                this.LogFileContent = new Array();
            }
            ServerLogViewModel.prototype.FromDto = function (dto) {
                this.LastEventId = dto.lastEventId;
                this.Timestamp = dto.timeStamp;
                this.LogFileContent = dto.logFileContent;
            };
            return ServerLogViewModel;
        }());
        WebClient.ServerLogViewModel = ServerLogViewModel;
        function initServerLog(serverLogPamaters) {
            edithandler(serverLogPamaters);
        }
        WebClient.initServerLog = initServerLog;
        function edithandler(serverLogPamaters) {
            var logContainer = serverLogPamaters.logContainer;
            WebClient.model = new ServerLogViewModel();
            var hubClient = new NotificationsHubClient();
            hubClient.init();
            var skipModified = false;
            WebClient.serverLogVue = new Vue({
                el: serverLogPamaters.selector,
                data: WebClient.model,
                methods: {
                    clearLog: function () {
                        $.ajax({
                            url: '/api/server/log',
                            type: 'delete',
                            dataType: 'html',
                            async: true,
                            success: function () {
                                WebClient.model.LogFileContent = [];
                            },
                            error: function (data) {
                                alert(data);
                            }
                        });
                    },
                    fetchData: function () {
                        $.ajax({
                            url: '/api/server/log',
                            type: 'get',
                            dataType: 'json',
                            async: true,
                            success: function (response) {
                                WebClient.model.FromDto(response.data);
                                hubClient.start();
                            },
                            error: function (data) {
                            }
                        });
                    },
                    scrollLog: function () {
                        $(logContainer).scrollTop($(logContainer)[0].scrollHeight);
                    }
                },
                created: function () {
                    this.fetchData();
                },
                //vue js event  
                updated: function () {
                },
                //vue js event  
                beforeUpdate: function () {
                },
                mounted: function () {
                    var vm = this;
                    skipModified = false;
                    $(serverLogPamaters.selector + "-loading").hide();
                    $(serverLogPamaters.selector).fadeIn();
                },
                watch: {},
                computed: {}
            });
            hubClient.onDone = function () {
                console.log("hubClient.onDone called");
                console.log(WebClient.model.LastEventId + " " + WebClient.model.Timestamp);
                hubClient.NotificationsHub.server.subscribeServerLogEvents(WebClient.model.LastEventId, WebClient.model.Timestamp).done(function (items) {
                    //model.LogFileContent.push("===>GET ON SUBSCIBE FROM " + model.LastEventId);
                    items.forEach(function (item) {
                        WebClient.model.LogFileContent.push(item);
                    });
                    //model.LogFileContent.push("===>GET ON SUSCIBE END");
                    //model.LogFileContent.push("RENDER BUF: CNT=" + incomingBuffer.length);
                    useBuffer = false;
                    incomingBuffer.forEach(function (x) {
                        WebClient.model.LogFileContent.push(x);
                    });
                    incomingBuffer = [];
                    performScroll = true;
                });
            };
            var performScroll = false;
            var useBuffer = true;
            setInterval(function () {
                if (performScroll) {
                    WebClient.serverLogVue.scrollLog();
                    performScroll = false;
                }
            }, 500);
            hubClient.NotificationsHub.client.serverLogChanged = function (newRecords) {
                console.log("serverLogChanged " + newRecords[0]);
                newRecords.forEach(function (item) {
                    //   let p = buildLogParagraph(item);
                    if (useBuffer)
                        incomingBuffer.push(item);
                    else
                        WebClient.model.LogFileContent.push(item);
                    //$(logContainer).append(p);                
                });
                performScroll = true;
            };
        }
    })(WebClient = Morph.WebClient || (Morph.WebClient = {}));
})(Morph || (Morph = {}));
//# sourceMappingURL=ServerLog.js.map