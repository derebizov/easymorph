/// <reference path="notificationshubclient.ts" />
import * as Vue from "vue";

namespace Morph.WebClient {
    declare let bootbox: any;

    let jobsLisVue: IjobsListVue;

    class JobsListModel {
        message: string;
        jobs: Array<IJobListItemDto>;
        sortKey: string;
        sortOrders: KeyedCollection<number>;       
        constructor() {
            this.message = "";
            this.jobs = new Array<IJobListItemDto>()
            this.sortKey = "name";
            this.sortOrders = new KeyedCollection<number>();
            this.sortOrders.Add("name", 1);
            this.sortOrders.Add("status", 1);           
        }
    }


    interface IjobsListVue extends Vue, JobsListModel {
        fetchData(): void;
        filteredData(filterFunct: (job: IJobListItemDto) => boolean): any;
    }

    
    export function initJobsList(selector: string = '#jobTasks'): void {

        let model: JobsListModel = new JobsListModel()
        var hubClient: NotificationsHubClient = new NotificationsHubClient();
        hubClient.init();


        jobsLisVue = new Vue({
            el: selector,
            data: model,
            methods: {
                fetchData: function (): void {
                    var vm = this as IjobsListVue;
                    console.log("fetchData called");
                    $.ajax({
                        url: '/api/jobs/?_=' + (new Date()).getTime(),
                        type: 'get',
                        dataType: 'json',
                        async: true,
                        success: function (response: any): void {
                            vm.message = "new msg";
                            vm.jobs = response.data.jobs;
                        },
                        error: function (data: any): void {
                            setTimeout(() => {
                                console.log("retry...");
                                vm.fetchData();
                            }, 1000);
                        }
                    });
                },
                sortBy: function (key: string): void {
                    console.log(key);
                    let vm = this as IjobsListVue;
                    vm.sortKey = key
                    //vm.sortOrders[key] = vm.sortOrders[key] * -1;
                    vm.sortOrders.Add(key,vm.sortOrders.Item(key) * -1);
                },
                generateSomething: function (param: IJobListItemDto): string {
                    return param.status + "SS";
                },
                startJob: function (job: IJobListItemDto): void {
                    $.ajax({
                        url: '/api/runningjobs/' + job.jobId,
                        type: 'put',
                        dataType: 'html',
                        async: true,
                        success: function (response: any): void {
                       //     bootbox.alert(`job started`);
                        },
                        error: function (data: any): void {
                            bootbox.alert(`job starting failed`);
                        }
                    });

                  
                },
                stopJob: function (job: IJobListItemDto): void {
                    $.ajax({
                        url: '/api/runningjobs/' + job.jobId,
                        type: 'delete',
                        dataType: 'html',
                        async: true,
                        success: function (response: any): void {
                           
                        },
                        error: function (data: any): void {
                            bootbox.alert(`job stopping failed`);
                        }
                    });
                },
                deleteJob: function (job: IJobListItemDto): void {
                    let vm = this as IjobsListVue;
                    bootbox.confirm({
                        message: `Are you sure you want to delete the job '${job.name}'?`,
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
                        callback: function (deletionAccepted: boolean) {
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
            created: function (): void {
                (this as IjobsListVue).fetchData();
            },
            mounted: function (): void {
                $(selector+"-loading").hide();
                $(selector).fadeIn();

            },
            computed: {
                booksList() {
                    var vm = this as IjobsListVue;
                    console.log("booksList");
                    return vm.jobs.map((b: IJobListItemDto) => {
                        b.text = b.jobId + " ok";
                        return b;
                    })
                },
                failedJobs: function (filterFunct: (job: IJobListItemDto) => boolean) {
                    var vm = this as IjobsListVue;
                    var sortKey = vm.sortKey;
                    var order = vm.sortOrders.Item(sortKey) || 1;
                    var data = vm.jobs;

                    console.log('filteredData');
                    data = data.filter((job) => { return job.status === "failed" });
                    data = data.slice().sort(function (a: any, b: any) {
                        a = a[sortKey]
                        b = b[sortKey]
                        return (a === b ? 0 : a > b ? 1 : -1) * order
                    })
                    return data;
                },
                standartJobs: function (filterFunct: (job: IJobListItemDto) => boolean) {
                    var vm = this as IjobsListVue;
                    var sortKey = vm.sortKey;
                    var order = vm.sortOrders.Item(sortKey) || 1;
                    var data = vm.jobs;

                    console.log('filteredData');
                    data = data.filter((job) => { return job.status !== "failed" });
                    data = data.slice().sort(function (a: any, b: any) {
                        a = a[sortKey]
                        b = b[sortKey]
                        return (a === b ? 0 : a > b ? 1 : -1) * order
                    })
                    return data;
                },

            }

        }) as IjobsListVue;



        hubClient.NotificationsHub.client.jobsCollectionChanged =
            (action: string, newItems: Array<string>, oldItems: Array<string>) => {
                jobsLisVue.fetchData();
                console.log(action);
                console.log(newItems);
                console.log(oldItems);

            }
        hubClient.start();
        
    }

}


