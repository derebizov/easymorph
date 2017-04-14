/// <reference path="notificationshubclient.ts" />
/// <reference path="../typefiles/moment.d.ts" />


import * as Vue from "vue";
import * as moment from "../typefiles/moment";



namespace Morph.WebClient {
    declare let bootbox: any;


    interface IjobLogPamaters {
        selector: string;
        jobId: string;
        
    }

    interface IJobErrorVm {
        Description: string;
        Location: string;
    }

    let incomingBuffer: Array<string> = new Array<string>();

    //view model for binding to edit job page
    export class JobLogViewModel {

        public JobId: string;
        //Modified flag; autoset when any model property was changed
        public Modified: boolean = false;
        public ErrorsCount: number = 0;
        public Errors: Array<IJobErrorVm> = new Array<IJobErrorVm>();
        public JobStatus: string = "";
        public LastEventId: number;
        public Timestamp: string;
        public LogFileContent: Array<string> = new Array<string>();
        constructor() {

        }

        public FromDto(dto: IJobLogDto): void {
            this.JobId = dto.jobId;
            this.ErrorsCount = dto.errorsCount;
            this.Errors = (dto.errors || [])
                .map((value: IJobLogErrorDto) => {
                    return <IJobErrorVm>{ Description: value.description, Location: value.location}
                })
            
            this.LastEventId = dto.lastEventId;
            this.Timestamp = dto.timeStamp;
            this.LogFileContent = dto.logFileContent;
        }
    }



    interface IjobLogVue extends Vue, JobLogViewModel {
        fetchErrors(): void;
        scrollLog(): void;   
    }

    export let jobLogVue: IjobLogVue;


    function buildLogParagraph(content: string): string{
        if (content === null)
            return "";
        return "<p>" + content.replace(/ /g, "&nbsp;") + "</p>"
    }


    export function initJobLog(jobLogPamaters: IjobLogPamaters): void {

       
        edithandler(jobLogPamaters);
    }

    export let model: JobLogViewModel;
    function edithandler(jobLogPamaters: IjobLogPamaters): void {

        const logContainer = "#logdiv";
        model = new JobLogViewModel();
        model.JobId = jobLogPamaters.jobId;
       

        var hubClient: NotificationsHubClient = new NotificationsHubClient();
        hubClient.init();

        let skipModified: boolean = false;

        jobLogVue = new Vue({
            el: jobLogPamaters.selector,
            data: model,

            methods: {
                clearLog: function (): void {
                    $.ajax({
                        url: '/api/jobs/' + jobLogPamaters.jobId + '/log',
                        type: 'delete',
                        dataType: 'html',
                        async: true,
                        success: function (response: { data: IJobLogDto }): void {                            
                            //$(logContainer).empty();
                            model.LogFileContent = [];
                        },
                        error: function (data: any): void {
                            alert(data)
                        }
                    });
                },
                fetchErrors: function (): void {
                    $.ajax({
                        url: '/api/jobs/' + jobLogPamaters.jobId + '/log?fields=errors',
                        type: 'get',
                        dataType: 'json',
                        async: true,
                        success: function (response: { data: IJobLogDto }): void {
                            model.ErrorsCount = response.data.errorsCount;
                            model.Errors = (response.data.errors || [])
                                .map((value: IJobLogErrorDto) => {
                                    return <IJobErrorVm>{ Description: value.description, Location: value.location }
                                })

                        },
                        error: function (data: any): void {
                          
                        }
                    });
                },
                fetchData: function (): void {
                    $.ajax({
                        url: '/api/jobs/' + jobLogPamaters.jobId + '/log',
                        type: 'get',
                        dataType: 'json',
                        async: true,
                        success: function (response: { data: IJobLogDto }): void {
                            //console.log(response.data);
                            model.FromDto(response.data);
                            hubClient.start();
                        },
                        error: function (data: any): void {

                        }
                    });
                },
                scrollLog: function (): void {
                    $(logContainer).scrollTop($(logContainer)[0].scrollHeight);
                }
              
            },
            created: function():void {
                (this as any).fetchData();
              
            },
            //vue js event  
            updated: function (): void {
                
            },
            //vue js event  
            beforeUpdate: function (): void {
              
            },
            mounted: function (): void {
                let vm = this as IjobLogVue;
                console.log("hubClient.start")
                
                skipModified = false;
                $(jobLogPamaters.selector + "-loading").hide();
                $(jobLogPamaters.selector).fadeIn();
                
            },
            watch: {



            },

            computed: {
                alertText: function (): string {
                    let errCount = model.Errors.length;
                    switch (errCount) {
                        case 0: return "";
                        case 1: return "1 error";
                        default: return `${errCount} errors`;
                    };                    
                }

            }




        }) as IjobLogVue;


        hubClient.onDone = () => {
            console.log("hubClient.onDone")
            console.log(jobLogPamaters.jobId + " " + model.LastEventId + " " + model.Timestamp)
            hubClient.NotificationsHub.server.subscribeJobLogEvents(jobLogPamaters.jobId, model.LastEventId, model.Timestamp).done((items) => {
                
                //model.LogFileContent.push("===>GET ON SUBSCIBE FROM " + model.LastEventId);
                items.forEach((item) => {
                    model.LogFileContent.push(item);                
                });
                //model.LogFileContent.push("===>GET ON SUSCIBE END");
                
                //model.LogFileContent.push("RENDER BUF: CNT=" + incomingBuffer.length);
                useBuffer = false;
                incomingBuffer.forEach((x) => {
                    model.LogFileContent.push(x);
                });
                
                incomingBuffer = [];
                performScroll = true;
            });
        };

        let performScroll = false;
        let useBuffer = true;
        setInterval(() => {
             if (performScroll) {
                 jobLogVue.scrollLog();
                performScroll = false
            }
        }, 500);

        hubClient.NotificationsHub.client.jobLogChanged = (jobId: string, newRecords: string[]) => {         
            //model.LogFileContent.push(newRecords[0]);
            newRecords.forEach((item) => {
             //   let p = buildLogParagraph(item);
                if (useBuffer) 
                    incomingBuffer.push(item);                
                else 
                    model.LogFileContent.push(item);
                    //$(logContainer).append(p);                
            });
            
            performScroll = true;
           
        }
        hubClient.NotificationsHub.client.jobStatusChanged = (jobId: string, status: string) => {
            console.log(`new status for ${jobId} ${status}`);
            model.JobStatus = status;
            jobLogVue.fetchErrors();
        };

        //$(document).ready(() => {
            
        //    hubClient.start();
            
        //});
        

    }

}