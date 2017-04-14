/// <reference path="notificationshubclient.ts" />
/// <reference path="../typefiles/moment.d.ts" />


import * as Vue from "vue";
import * as moment from "../typefiles/moment";



namespace Morph.WebClient {
    declare let bootbox: any;


    interface IserverLogPamaters {
        selector: string;
        logContainer: string;
    }

   let incomingBuffer: Array<string> = new Array<string>();

    
    export class ServerLogViewModel {               
        public LastEventId: number;
        public Timestamp: string;
        public LogFileContent: Array<string> = new Array<string>();
        constructor() {

        }

        public FromDto(dto: IServerLogDto): void {
            this.LastEventId = dto.lastEventId;
            this.Timestamp = dto.timeStamp;
            this.LogFileContent = dto.logFileContent;
        }
    }



    interface IserverLogVue extends Vue, ServerLogViewModel {        
        scrollLog(): void;   
    }

    export let serverLogVue: IserverLogVue;
        
    export function initServerLog(serverLogPamaters: IserverLogPamaters): void {

       
        edithandler(serverLogPamaters);
    }

    export let model: ServerLogViewModel;
    function edithandler(serverLogPamaters: IserverLogPamaters): void {

        const logContainer = serverLogPamaters.logContainer;
        model = new ServerLogViewModel();
        
        var hubClient: NotificationsHubClient = new NotificationsHubClient();
        hubClient.init();

        let skipModified: boolean = false;

        serverLogVue = new Vue({
            el: serverLogPamaters.selector,
            data: model,
            methods: {
                clearLog: function (): void {
                    $.ajax({
                        url: '/api/server/log',
                        type: 'delete',
                        dataType: 'html',
                        async: true,
                        success: function (): void {                                                        
                            model.LogFileContent = [];
                        },
                        error: function (data: any): void {
                            alert(data)
                        }
                    });
                },                
                fetchData: function (): void {
                    $.ajax({
                        url: '/api/server/log',
                        type: 'get',
                        dataType: 'json',
                        async: true,
                        success: function (response: { data: IServerLogDto }): void {
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
                let vm = this as IserverLogVue;               
                
                skipModified = false;
                $(serverLogPamaters.selector + "-loading").hide();
                $(serverLogPamaters.selector).fadeIn();
                
               
               
                
            },
            watch: {



            },

            computed: {
              

            }




        }) as IserverLogVue;


        hubClient.onDone = () => {
            console.log("hubClient.onDone called")
            console.log(model.LastEventId + " " + model.Timestamp)
            hubClient.NotificationsHub.server.subscribeServerLogEvents( model.LastEventId, model.Timestamp).done((items) => {
                
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
                 serverLogVue.scrollLog();
                performScroll = false
            }
        }, 500);

        hubClient.NotificationsHub.client.serverLogChanged = (newRecords: string[]) => {         

            console.log("serverLogChanged " + newRecords[0])


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
        

        
        

    }

}