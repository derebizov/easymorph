"use strict";
/// <reference path="notificationshubclient.ts" />
var Vue = require("vue");
var Morph;
(function (Morph) {
    var WebClient;
    (function (WebClient) {
        var jobsLisVue;
        var JobsListModel = (function () {
            function JobsListModel() {
                this.message = "";
                this.jobs = new Array();
                this.sortKey = "name";
                this.sortOrders = new KeyedCollection();
                this.sortOrders.Add("name", 1);
                this.sortOrders.Add("status", 1);
            }
            return JobsListModel;
        }());
        function initJobsList(selector) {
            if (selector === void 0) { selector = '#jobTasks'; }
            var model = new JobsListModel();
            var hubClient = new NotificationsHubClient();
            hubClient.init();
            jobsLisVue = new Vue({
                el: selector,
                data: model,
                methods: {
                    fetchData: function () {
                        var vm = this;
                        console.log("fetchData called");
                        $.ajax({
                            url: '/api/jobs/?_=' + (new Date()).getTime(),
                            type: 'get',
                            dataType: 'json',
                            async: true,
                            success: function (response) {
                                vm.message = "new msg";
                                vm.jobs = response.data.jobs;
                            },
                            error: function (data) {
                                setTimeout(function () {
                                    console.log("retry...");
                                    vm.fetchData();
                                }, 1000);
                            }
                        });
                    },
                    sortBy: function (key) {
                        console.log(key);
                        var vm = this;
                        vm.sortKey = key;
                        //vm.sortOrders[key] = vm.sortOrders[key] * -1;
                        vm.sortOrders.Add(key, vm.sortOrders.Item(key) * -1);
                    },
                    generateSomething: function (param) {
                        return param.status + "SS";
                    },
                    startJob: function (job) {
                        $.ajax({
                            url: '/api/runningjobs/' + job.jobId,
                            type: 'put',
                            dataType: 'html',
                            async: true,
                            success: function (response) {
                                //     bootbox.alert(`job started`);
                            },
                            error: function (data) {
                                bootbox.alert("job starting failed");
                            }
                        });
                    },
                    stopJob: function (job) {
                        $.ajax({
                            url: '/api/runningjobs/' + job.jobId,
                            type: 'delete',
                            dataType: 'html',
                            async: true,
                            success: function (response) {
                            },
                            error: function (data) {
                                bootbox.alert("job stopping failed");
                            }
                        });
                    },
                    deleteJob: function (job) {
                        var vm = this;
                        bootbox.confirm({
                            message: "Are you sure you want to delete the job '" + job.name + "'?",
                            buttons: {
                                confirm: {
                                    label: 'Yes',
                                    className: 'btn-success'
                                },
                                cancel: {
                                    label: 'No',
                                    className: 'btn-danger'
                                }
                            },
                            callback: function (deletionAccepted) {
                                if (deletionAccepted) {
                                    $.ajax({
                                        url: '/api/jobs/' + job.jobId,
                                        type: 'delete',
                                        dataType: 'html',
                                        async: true,
                                        success: function (response) {
                                            // FETCH DATA ONLY IF SIGNALR FAILS   
                                            if (!hubClient.IsConnected) {
                                                vm.fetchData();
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                },
                created: function () {
                    this.fetchData();
                },
                mounted: function () {
                    $(selector + "-loading").hide();
                    $(selector).fadeIn();
                },
                computed: {
                    booksList: function () {
                        var vm = this;
                        console.log("booksList");
                        return vm.jobs.map(function (b) {
                            b.text = b.jobId + " ok";
                            return b;
                        });
                    },
                    failedJobs: function (filterFunct) {
                        var vm = this;
                        var sortKey = vm.sortKey;
                        var order = vm.sortOrders.Item(sortKey) || 1;
                        var data = vm.jobs;
                        console.log('filteredData');
                        data = data.filter(function (job) { return job.status === "failed"; });
                        data = data.slice().sort(function (a, b) {
                            a = a[sortKey];
                            b = b[sortKey];
                            return (a === b ? 0 : a > b ? 1 : -1) * order;
                        });
                        return data;
                    },
                    standartJobs: function (filterFunct) {
                        var vm = this;
                        var sortKey = vm.sortKey;
                        var order = vm.sortOrders.Item(sortKey) || 1;
                        var data = vm.jobs;
                        console.log('filteredData');
                        data = data.filter(function (job) { return job.status !== "failed"; });
                        data = data.slice().sort(function (a, b) {
                            a = a[sortKey];
                            b = b[sortKey];
                            return (a === b ? 0 : a > b ? 1 : -1) * order;
                        });
                        return data;
                    },
                }
            });
            hubClient.NotificationsHub.client.jobsCollectionChanged =
                function (action, newItems, oldItems) {
                    jobsLisVue.fetchData();
                    console.log(action);
                    console.log(newItems);
                    console.log(oldItems);
                };
            hubClient.start();
        }
        WebClient.initJobsList = initJobsList;
    })(WebClient = Morph.WebClient || (Morph.WebClient = {}));
})(Morph || (Morph = {}));
//# sourceMappingURL=JobsList.js.map