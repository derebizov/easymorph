/// <reference path="notificationshubclient.ts" />
/// <reference path="../typefiles/moment.d.ts" />


import * as Vue from "vue";
import * as moment from "../typefiles/moment";



namespace Morph.WebClient {
    declare let bootbox: any;


    //Vue.filter('formatDate', function (date:any) {

    //    return moment(date).format("YYYY-MM-DD")
    //})

    
    
    interface IjobEditPamaters {
        selector: string;
        editMode: EditMode;
        jobId: string;
        morphProjectsRoot: string;
        jobDto: IFullJobDto;
        g11Preferences: IG11Preferences;
    }
    


    interface IJobParameterVm {
        Name: string;
        Value: string;
    }

    //view model for binding to edit job page
    export class EditJobViewModel {
        public EditMode: EditMode;
        public JobId: string;
        public MorphProjectsRoot: string;
        //Modified flag; autoset when any model property was changed
        public Modified: boolean = false;
        public ProjectFile: string = "";
        public TaskDisabled: boolean = false;
        public GenerateReport: boolean = false;
        public ScheduleType: string = ScheduleType.NoSchedule;
        
        public Minute: number = 0;
        public DaysOfWeek: Array<string> = [];
        public OnceOccurrenceDate: moment.Moment = null; // moment("12.12.2007 13:28", "DD.MM.YYYY HH:mm");
        public DailyOccurrenceTime: moment.Moment = null;
        public g11Preferences: IG11Preferences;
        public validator: any = null;
        
        public JobParameters: Array<IJobParameterVm>;

        constructor() {
            this.JobParameters = new Array<IJobParameterVm>();
        }
        public ToDto(): IFullJobDto {
            let dto = <IFullJobDto>{
                enabled: !this.TaskDisabled,
                generateReport: this.GenerateReport,
                jobParameters: (this.JobParameters||[])
                    .map((value: IJobParameterVm) =>
                    {
                        return <IJobParameterDto>{ name: value.Name, value: value.Value }
                    }),
                //projectFile: this.ProjectFile,
                schedule: {
                    scheduleType: this.ScheduleType,                   
                }
            };
            dto.projectFile = makeAbsolutePath(this.MorphProjectsRoot, this.ProjectFile);

            switch (this.ScheduleType) {
                case ScheduleType.NoSchedule: break;
                case ScheduleType.OnceSchedule:
                    if (this.OnceOccurrenceDate != null) {
                        dto.schedule.date = this.OnceOccurrenceDate.format();                    
                    }                    
                    break;
                case ScheduleType.HourlySchedule:
                    dto.schedule.minute = this.Minute;
                    break;
                case ScheduleType.DailySchedule:
                    dto.schedule.daysOfWeek = this.DaysOfWeek;
                    if (this.DailyOccurrenceTime != null) {
                        dto.schedule.hour = parseInt(this.DailyOccurrenceTime.format("HH"));
                        dto.schedule.minute = parseInt(this.DailyOccurrenceTime.format("mm"));
                    }
                    break;
            }
          
            return dto;
        }
        public FromDto(dto: IFullJobDto): void {
            this.TaskDisabled = !dto.enabled;
            this.GenerateReport = dto.generateReport;
            //dto?
            this.JobParameters = new Array<IJobParameterVm>();
            if (dto.jobParameters !== null) {
                for (let entry of dto.jobParameters) {
                    this.JobParameters.push(<IJobParameterVm>{ Name: entry.name, Value: entry.value });
                }
            }
            this.ProjectFile = makeRelativePath(this.MorphProjectsRoot, dto.projectFile);
            

            this.ScheduleType = dto.schedule.scheduleType;
            this.Minute = dto.schedule.minute || 0;
            
            this.DaysOfWeek = dto.schedule.daysOfWeek;
            switch (this.ScheduleType) {
                case ScheduleType.NoSchedule: break;
                case ScheduleType.OnceSchedule:
                    if (dto.schedule.date != null) {
                        this.OnceOccurrenceDate = moment(dto.schedule.date);
                    }
                    break;
                case ScheduleType.HourlySchedule:
                    
                    break;
                case ScheduleType.DailySchedule:
                    this.DaysOfWeek = dto.schedule.daysOfWeek;

                    this.DailyOccurrenceTime = moment(`${dto.schedule.hour||0}:${dto.schedule.minute||0}`, 'H:m');
                    
                    break;
            }




        }
    }



    interface IjobEditVue extends Vue, EditJobViewModel {
        fetchData(): void;
        canChange: boolean;
        resetModify(): void;
        canRevert: boolean;
    }

    export let jobEditVue: IjobEditVue;




    export function initJobEdit(jobEditPamaters: IjobEditPamaters): void {


        edithandler(jobEditPamaters);
    }

    export let model: EditJobViewModel;
    function edithandler(jobEditPamaters : IjobEditPamaters): void {

        model = new EditJobViewModel();
        model.EditMode = jobEditPamaters.editMode;
        model.MorphProjectsRoot = jobEditPamaters.morphProjectsRoot;
        model.JobId = jobEditPamaters.jobId;
        model.g11Preferences = jobEditPamaters.g11Preferences;
        let jobDto: IFullJobDto = jobEditPamaters.jobDto;
        if (model.EditMode !== EditMode.Create) {
            model.FromDto(jobDto);
        };
        



        var hubClient: NotificationsHubClient = new NotificationsHubClient();
        hubClient.init();
        let skipModified: boolean = false;

        jobEditVue = new Vue({
            el: jobEditPamaters.selector,
            data: model,
           
            methods: {
                browseMorphFile: function (): void {
                    let vm = this as IjobEditVue;
                    if (!vm.canChange)
                        return;
                    bootbox.alert(`not implemented yet`);
                },
                resetModify: function (): void {
                    skipModified = true;
                    model.Modified = false;
                    
                        

                },
                saveChanges: function (): void {
                    let vm = this as IjobEditVue;
                    if (!model.Modified)
                        return
                    let dto = model.ToDto();
                    let json = JSON.stringify(dto);
                    vm.validator.resetForm();

                    if (model.EditMode  === EditMode.Edit) {
                        $.ajax({
                            url: '/api/jobs/' + model.JobId,
                            type: 'put',
                            data : json,
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            async: true,
                            success: function (response) {
                                
                                jobDto = dto;
                                vm.resetModify();
                                //bootbox.alert(`job saved`);
                                location.href = "/jobs";
                            },
                            error: function (xhr: any): void {
                                if (xhr.status === 400) {
                                    
                                    var errors = xhr.responseJSON.errors as Array<IErrorDto>;
                                    if (errors != null) {
                                        let ve: any = new Object();
                                        errors.filter((x) => x.errorCode == ErrorCode.ValidationError).forEach((x) => { ve[x.fieldName] = x.message });
                                        vm.validator.showErrors(ve);
                                    }
                                }
                            }
                        });
                    }
                    else if (model.EditMode === EditMode.Create) {
                        $.ajax({
                            url: '/api/jobs/',
                            type: 'post',
                            dataType: 'json',
                            data:json,
                            contentType: "application/json; charset=utf-8",
                            async: true,
                            success: function (response:any) {
                                
                                //bootbox.alert(`job created`);
                                model.EditMode = EditMode.Edit;
                                //model.JobId = response.data.resourceId;
                                jobDto = dto;
                                vm.resetModify();
                                location.href = "/jobs";
                            }, error: function (xhr: any): void {
                                if (xhr.status === 400) {
                                    
                                    var errors = xhr.responseJSON.errors as Array<IErrorDto>;
                                    if (errors != null) {
                                        let ve: any = new Object();
                                        errors.filter((x) => x.errorCode == ErrorCode.ValidationError).forEach((x) => { ve[x.fieldName] = x.message });
                                        vm.validator.showErrors(ve);
                                    }
                                }
                            }
                        });
                    };



                    //bootbox.alert(`not implemented yet`);
                },
                revertChanges: function (): void {
                    let vm = this as IjobEditVue;
                    if (!vm.canRevert)
                        return;

                    model.FromDto(jobDto);                    
                    vm.resetModify();                   

                },
                addParam: function (): void {
                    let vm = this as IjobEditVue;
                    if (!vm.canChange)
                        return;
                    if (model.JobParameters.some((value: IJobParameterVm) => {
                        return (value.Name.length === 0 || !value.Name.trim());
                    }))
                        return;
                    model.JobParameters.push(<IJobParameterVm>{ Name: "", Value: "" });
                },
                removeParam: function (param: IJobParameterDto, index: number): void {
                    let vm = this as IjobEditVue;
                    if (!vm.canChange)
                        return;
                    model.JobParameters.splice(index, 1)
                },
                hourlyMinutes: function (): Array<number> {
                    let result = new Array<number>();

                    for (let i = 0; i < 12; i++) {
                        result.push(i * 5);
                    }
                    return result;
                }
            },
            //vue js event  
            updated: function (): void {
                skipModified = false;
                ($('.sp') as any).selectpicker();          

            },
            //vue js event  
            beforeUpdate: function (): void {                
                if (!skipModified) {
                    if (!model.Modified) {
                        model.Modified = true;
                    }
                }
            },
            mounted: function():void{
                let vm = this as IjobEditVue;
                
                skipModified = false;
                $(jobEditPamaters.selector + "-loading").hide();
                $(jobEditPamaters.selector).fadeIn();
                vm.validator = buildBSValidator(jobEditPamaters.selector + ' form');
                vm.resetModify();    
                skipModified = false;
            },
            watch: {
              
                
                                
            },

            computed: {
                canSave: function (): boolean {
                    return model.Modified;
                },
                canRevert: function (): boolean {
                    return model.Modified && model.EditMode === EditMode.Edit;
                },
                canAddNewParam: function (): boolean {
                    let vm = this as IjobEditVue;
                    if (!vm.canChange)
                        return false;
                    return !(model.JobParameters.some((value: IJobParameterVm) => {

                        return (value.Name.length === 0 || !value.Name.trim());
                    }))
                },
                canChange: function (): boolean {
                    return !model.TaskDisabled;
                },
               
            }




        }) as IjobEditVue;

        ($('.sp') as any).selectpicker();


        window.onbeforeunload = function (): any{
            if (jobEditVue.Modified) {
                return "You have unsaved changes.  Do you want to leave this page and lose your changes?";
            }
        }

    }

}