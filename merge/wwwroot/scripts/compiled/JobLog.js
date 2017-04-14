/// <reference path="notificationshubclient.ts" />
/// <reference path="../typefiles/moment.d.ts" />
"use strict";
var Vue = require("vue");
var Morph;
(function (Morph) {
    var WebClient;
    (function (WebClient) {
        var incomingBuffer = new Array();
        //view model for binding to edit job page
        var JobLogViewModel = (function () {
            function JobLogViewModel() {
                //Modified flag; autoset when any model property was changed
                this.Modified = false;
                this.ErrorsCount = 0;
                this.Errors = new Array();
                this.JobStatus = "";
                this.LogFileContent = new Array();
            }
            JobLogViewModel.prototype.FromDto = function (dto) {
                this.JobId = dto.jobId;
                this.ErrorsCount = dto.errorsCount;
                this.Errors = (dto.errors || [])
                    .map(function (value) {
                    return { Description: value.description, Location: value.location };
                });
                this.LastEventId = dto.lastEventId;
                this.Timestamp = dto.timeStamp;
                this.LogFileContent = dto.logFileContent;
            };
            return JobLogViewModel;
        }());
        WebClient.JobLogViewModel = JobLogViewModel;
        function buildLogParagraph(content) {
            if (content === null)
                return "";
            return "<p>" + content.replace(/ /g, "&nbsp;") + "</p>";
        }
        function initJobLog(jobLogPamaters) {
            edithandler(jobLogPamaters);
        }
        WebClient.initJobLog = initJobLog;
        function edithandler(jobLogPamaters) {
            var logContainer = "#logdiv";
            WebClient.model = new JobLogViewModel();
            WebClient.model.JobId = jobLogPamaters.jobId;
            var hubClient = new NotificationsHubClient();
            hubClient.init();
            var skipModified = false;
            WebClient.jobLogVue = new Vue({
                el: jobLogPamaters.selector,
                data: WebClient.model,
                methods: {
                    clearLog: function () {
                        $.ajax({
                            url: '/api/jobs/' + jobLogPamaters.jobId + '/log',
                            type: 'delete',
                            dataType: 'html',
                            async: true,
                            success: function (response) {
                                //$(logContainer).empty();
                                WebClient.model.LogFileContent = [];
                            },
                            error: function (data) {
                                alert(data);
                            }
                        });
                    },
                    fetchErrors: function () {
                        $.ajax({
                            url: '/api/jobs/' + jobLogPamaters.jobId + '/log?fields=errors',
                            type: 'get',
                            dataType: 'json',
                            async: true,
                            success: function (response) {
                                WebClient.model.ErrorsCount = response.data.errorsCount;
                                WebClient.model.Errors = (response.data.errors || [])
                                    .map(function (value) {
                                    return { Description: value.description, Location: value.location };
                                });
                            },
                            error: function (data) {
                            }
                        });
                    },
                    fetchData: function () {
                        $.ajax({
                            url: '/api/jobs/' + jobLogPamaters.jobId + '/log',
                            type: 'get',
                            dataType: 'json',
                            async: true,
                            success: function (response) {
                                //console.log(response.data);
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
                    console.log("hubClient.start");
                    skipModified = false;
                    $(jobLogPamaters.selector + "-loading").hide();
                    $(jobLogPamaters.selector).fadeIn();
                },
                watch: {},
                computed: {
                    alertText: function () {
                        var errCount = WebClient.model.Errors.length;
                        switch (errCount) {
                            case 0: return "";
                            case 1: return "1 error";
                            default: return errCount + " errors";
                        }
                        ;
                    }
                }
            });
            hubClient.onDone = function () {
                console.log("hubClient.onDone");
                console.log(jobLogPamaters.jobId + " " + WebClient.model.LastEventId + " " + WebClient.model.Timestamp);
                hubClient.NotificationsHub.server.subscribeJobLogEvents(jobLogPamaters.jobId, WebClient.model.LastEventId, WebClient.model.Timestamp).done(function (items) {
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
                    WebClient.jobLogVue.scrollLog();
                    performScroll = false;
                }
            }, 500);
            hubClient.NotificationsHub.client.jobLogChanged = function (jobId, newRecords) {
                //model.LogFileContent.push(newRecords[0]);
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
            hubClient.NotificationsHub.client.jobStatusChanged = function (jobId, status) {
                console.log("new status for " + jobId + " " + status);
                WebClient.model.JobStatus = status;
                WebClient.jobLogVue.fetchErrors();
            };
            //$(document).ready(() => {
            //    hubClient.start();
            //});
        }
    })(WebClient = Morph.WebClient || (Morph.WebClient = {}));
})(Morph || (Morph = {}));
//# sourceMappingURL=JobLog.js.map