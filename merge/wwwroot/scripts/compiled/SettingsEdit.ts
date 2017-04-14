/// <reference path="../node_modules/@types/jquery/index.d.ts" />

import * as Vue from "vue";
import * as $ from "jquery";

namespace Morph.WebClient {
    declare let bootbox: any;

    class EditSettingsViewModel {
        public EditMode: EditMode = EditMode.Edit;
        public ProjectsFolder: string = "";
        public SystemFolder: string = "";
        //Modified flag; autoset when any model property was changed
        public Modified: boolean = false;
        public LogsFolder: string = "";
        public LicenseKeyFile: string = "";
        public RepositoryFile: string = "";
        public validator: any = null;
        public GlobalAlertText: string = "";
        public GlobalError: boolean = false; 

        constructor() {

        }

        public ToDto(): IMorphServerSettingDto{
            let dto = <IMorphServerSettingDto>{
                licenseKeyFile: this.LicenseKeyFile,
                logsFolder: this.LogsFolder,
                projectsFolder: this.ProjectsFolder,
                repositoryFile: this.RepositoryFile,
                systemFolder: this.SystemFolder
            };
            return dto;        
        }
        public FromDto(dto: IMorphServerSettingDto): void {
            this.LicenseKeyFile = dto.licenseKeyFile;
            this.LogsFolder = dto.logsFolder;
            this.ProjectsFolder = dto.projectsFolder;
            this.RepositoryFile = dto.repositoryFile;
            this.SystemFolder = dto.systemFolder;
        }
    }


    interface IEditSettingsVue extends Vue, EditSettingsViewModel {
        fetchData(): void;
        canChange: boolean;
        resetModify(): void;
        canRevert: boolean;
        validator: any;
    }

    export let editSettingsVue: IEditSettingsVue;
    
    export let model: EditSettingsViewModel;
    export function initEditSettings(selector:string): void {
        
        model = new EditSettingsViewModel();
        //    model.FromDto(jobDto);

        edithandler(selector, model);
    }

    function edithandler(selector: string, model: EditSettingsViewModel): void {
        let initialSettingsDto: IMorphServerSettingDto = null;
        let hubClient: NotificationsHubClient = new NotificationsHubClient();
        hubClient.init();
        let skipModified: boolean = false;


        editSettingsVue = new Vue({
            el: selector,
            data: model,
            methods: {
                fetchData(): void {
                    let vm = this as IEditSettingsVue;
                    console.log("fetchData called");
                    $.ajax({
                        url: '/api/settings',
                        type: 'get',
                        dataType: 'json',
                        async: true,
                        success: function (response: { data: IMorphServerSettingDto }): void {
                            initialSettingsDto = response.data;
                            model.FromDto(response.data);   
                            vm.resetModify();             
                            
                        },
                        error: function (data: any): void {
                            alert(data)
                        }
                    });
                },
                resetModify(): void {
                    skipModified = true;
                    model.Modified = false;
                    
                },
                revertChanges: function (): void {
                    let vm = this as IEditSettingsVue;
                    if (!vm.canRevert)
                        return;
                    
                    model.FromDto(initialSettingsDto);
                    vm.resetModify();

                },
                saveChanges: function (): void {
                    let vm = this as IEditSettingsVue;
                    if (!model.Modified)
                        return
                    let dto = model.ToDto();
                    let json = JSON.stringify(dto);


                    $.ajax({
                        url: '/api/settings/',
                        type: 'put',
                        data: json,
                        dataType: 'json',
                        contentType: "application/json; charset=utf-8",
                        async: true,
                        success: function (response: any) {

                            vm.resetModify();
                            //bootbox.alert(`saved`);
                            location.href = "/jobs";
                        },
                        error: function (xhr: any): void {
                            if (xhr.status === 400) {
                                vm.validator.resetForm();
                                var errors = xhr.responseJSON.errors as Array<IErrorDto>;
                                if (errors != null) {
                                    let ve: any = new Object();
                                    errors.filter((x) => x.errorCode == ErrorCode.ValidationError).forEach((x) => { ve[x.fieldName] = x.message });
                                    vm.validator.showErrors(ve);
                                }
                                let jir = errors.filter((x) => x.errorCode != ErrorCode.ValidationError);
                                if (jir != null && jir.length > 0) {
                                    model.GlobalAlertText = jir[0].message;
                                    model.GlobalError = true;
                                }

                            }                            
                        }
                    });
                }
                    
            },
            computed: {
                canEdit: function (): boolean {
                    return !model.GlobalError;
                },
                canSave: function (): boolean {
                    return model.Modified && !model.GlobalError;
                },
                canRevert: function (): boolean {
                    return model.Modified;
                },
            },
            //vue js event  
            beforeUpdate: function (): void {
                if (!skipModified) {
                    if (!model.Modified) {
                        model.Modified = true;
                    }
                }
            },
            updated: function (): void {
                skipModified = false;            

            },
            created: function (): void {
                (this as IEditSettingsVue).fetchData();

            },
            mounted: function (): void {
                let vm = this as IEditSettingsVue;

                
                $(selector + "-loading").hide();
                $(selector).fadeIn();
                
               vm.validator = buildBSValidator(selector + ' form');
               vm.resetModify();
               skipModified = false;

            },
        }) as IEditSettingsVue;
        
        window.onbeforeunload = function (): any {
            if (editSettingsVue.Modified) {
                return "You have unsaved changes.  Do you want to leave this page and lose your changes?";
            }
        }
    }


}