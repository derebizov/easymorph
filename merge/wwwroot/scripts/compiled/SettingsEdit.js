/// <reference path="../node_modules/@types/jquery/index.d.ts" />
"use strict";
var Vue = require("vue");
var $ = require("jquery");
var Morph;
(function (Morph) {
    var WebClient;
    (function (WebClient) {
        var EditSettingsViewModel = (function () {
            function EditSettingsViewModel() {
                this.EditMode = EditMode.Edit;
                this.ProjectsFolder = "";
                this.SystemFolder = "";
                //Modified flag; autoset when any model property was changed
                this.Modified = false;
                this.LogsFolder = "";
                this.LicenseKeyFile = "";
                this.RepositoryFile = "";
                this.validator = null;
                this.GlobalAlertText = "";
                this.GlobalError = false;
            }
            EditSettingsViewModel.prototype.ToDto = function () {
                var dto = {
                    licenseKeyFile: this.LicenseKeyFile,
                    logsFolder: this.LogsFolder,
                    projectsFolder: this.ProjectsFolder,
                    repositoryFile: this.RepositoryFile,
                    systemFolder: this.SystemFolder
                };
                return dto;
            };
            EditSettingsViewModel.prototype.FromDto = function (dto) {
                this.LicenseKeyFile = dto.licenseKeyFile;
                this.LogsFolder = dto.logsFolder;
                this.ProjectsFolder = dto.projectsFolder;
                this.RepositoryFile = dto.repositoryFile;
                this.SystemFolder = dto.systemFolder;
            };
            return EditSettingsViewModel;
        }());
        function initEditSettings(selector) {
            WebClient.model = new EditSettingsViewModel();
            //    model.FromDto(jobDto);
            edithandler(selector, WebClient.model);
        }
        WebClient.initEditSettings = initEditSettings;
        function edithandler(selector, model) {
            var initialSettingsDto = null;
            var hubClient = new NotificationsHubClient();
            hubClient.init();
            var skipModified = false;
            WebClient.editSettingsVue = new Vue({
                el: selector,
                data: model,
                methods: {
                    fetchData: function () {
                        var vm = this;
                        console.log("fetchData called");
                        $.ajax({
                            url: '/api/settings',
                            type: 'get',
                            dataType: 'json',
                            async: true,
                            success: function (response) {
                                initialSettingsDto = response.data;
                                model.FromDto(response.data);
                                vm.resetModify();
                            },
                            error: function (data) {
                                alert(data);
                            }
                        });
                    },
                    resetModify: function () {
                        skipModified = true;
                        model.Modified = false;
                    },
                    revertChanges: function () {
                        var vm = this;
                        if (!vm.canRevert)
                            return;
                        model.FromDto(initialSettingsDto);
                        vm.resetModify();
                    },
                    saveChanges: function () {
                        var vm = this;
                        if (!model.Modified)
                            return;
                        var dto = model.ToDto();
                        var json = JSON.stringify(dto);
                        $.ajax({
                            url: '/api/settings/',
                            type: 'put',
                            data: json,
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            async: true,
                            success: function (response) {
                                vm.resetModify();
                                //bootbox.alert(`saved`);
                                location.href = "/jobs";
                            },
                            error: function (xhr) {
                                if (xhr.status === 400) {
                                    vm.validator.resetForm();
                                    var errors = xhr.responseJSON.errors;
                                    if (errors != null) {
                                        var ve_1 = new Object();
                                        errors.filter(function (x) { return x.errorCode == ErrorCode.ValidationError; }).forEach(function (x) { ve_1[x.fieldName] = x.message; });
                                        vm.validator.showErrors(ve_1);
                                    }
                                    var jir = errors.filter(function (x) { return x.errorCode != ErrorCode.ValidationError; });
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
                    canEdit: function () {
                        return !model.GlobalError;
                    },
                    canSave: function () {
                        return model.Modified && !model.GlobalError;
                    },
                    canRevert: function () {
                        return model.Modified;
                    },
                },
                //vue js event  
                beforeUpdate: function () {
                    if (!skipModified) {
                        if (!model.Modified) {
                            model.Modified = true;
                        }
                    }
                },
                updated: function () {
                    skipModified = false;
                },
                created: function () {
                    this.fetchData();
                },
                mounted: function () {
                    var vm = this;
                    $(selector + "-loading").hide();
                    $(selector).fadeIn();
                    vm.validator = buildBSValidator(selector + ' form');
                    vm.resetModify();
                    skipModified = false;
                },
            });
            window.onbeforeunload = function () {
                if (WebClient.editSettingsVue.Modified) {
                    return "You have unsaved changes.  Do you want to leave this page and lose your changes?";
                }
            };
        }
    })(WebClient = Morph.WebClient || (Morph.WebClient = {}));
})(Morph || (Morph = {}));
//# sourceMappingURL=SettingsEdit.js.map