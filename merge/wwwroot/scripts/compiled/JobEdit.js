/// <reference path="notificationshubclient.ts" />
/// <reference path="../typefiles/moment.d.ts" />
"use strict";
var Vue = require("vue");
var moment = require("../typefiles/moment");
var Morph;
(function (Morph) {
    var WebClient;
    (function (WebClient) {
        //view model for binding to edit job page
        var EditJobViewModel = (function () {
            function EditJobViewModel() {
                //Modified flag; autoset when any model property was changed
                this.Modified = false;
                this.ProjectFile = "";
                this.TaskDisabled = false;
                this.GenerateReport = false;
                this.ScheduleType = ScheduleType.NoSchedule;
                this.Minute = 0;
                this.DaysOfWeek = [];
                this.OnceOccurrenceDate = null; // moment("12.12.2007 13:28", "DD.MM.YYYY HH:mm");
                this.DailyOccurrenceTime = null;
                this.validator = null;
                this.JobParameters = new Array();
            }
            EditJobViewModel.prototype.ToDto = function () {
                var dto = {
                    enabled: !this.TaskDisabled,
                    generateReport: this.GenerateReport,
                    jobParameters: (this.JobParameters || [])
                        .map(function (value) {
                        return { name: value.Name, value: value.Value };
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
            };
            EditJobViewModel.prototype.FromDto = function (dto) {
                this.TaskDisabled = !dto.enabled;
                this.GenerateReport = dto.generateReport;
                //dto?
                this.JobParameters = new Array();
                if (dto.jobParameters !== null) {
                    for (var _i = 0, _a = dto.jobParameters; _i < _a.length; _i++) {
                        var entry = _a[_i];
                        this.JobParameters.push({ Name: entry.name, Value: entry.value });
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
                        this.DailyOccurrenceTime = moment((dto.schedule.hour || 0) + ":" + (dto.schedule.minute || 0), 'H:m');
                        break;
                }
            };
            return EditJobViewModel;
        }());
        WebClient.EditJobViewModel = EditJobViewModel;
        function initJobEdit(jobEditPamaters) {
            edithandler(jobEditPamaters);
        }
        WebClient.initJobEdit = initJobEdit;
        function edithandler(jobEditPamaters) {
            WebClient.model = new EditJobViewModel();
            WebClient.model.EditMode = jobEditPamaters.editMode;
            WebClient.model.MorphProjectsRoot = jobEditPamaters.morphProjectsRoot;
            WebClient.model.JobId = jobEditPamaters.jobId;
            WebClient.model.g11Preferences = jobEditPamaters.g11Preferences;
            var jobDto = jobEditPamaters.jobDto;
            if (WebClient.model.EditMode !== EditMode.Create) {
                WebClient.model.FromDto(jobDto);
            }
            ;
            var hubClient = new NotificationsHubClient();
            hubClient.init();
            var skipModified = false;
            WebClient.jobEditVue = new Vue({
                el: jobEditPamaters.selector,
                data: WebClient.model,
                methods: {
                    browseMorphFile: function () {
                        var vm = this;
                        if (!vm.canChange)
                            return;
                        bootbox.alert("not implemented yet");
                    },
                    resetModify: function () {
                        skipModified = true;
                        WebClient.model.Modified = false;
                    },
                    saveChanges: function () {
                        var vm = this;
                        if (!WebClient.model.Modified)
                            return;
                        var dto = WebClient.model.ToDto();
                        var json = JSON.stringify(dto);
                        vm.validator.resetForm();
                        if (WebClient.model.EditMode === EditMode.Edit) {
                            $.ajax({
                                url: '/api/jobs/' + WebClient.model.JobId,
                                type: 'put',
                                data: json,
                                dataType: 'json',
                                contentType: "application/json; charset=utf-8",
                                async: true,
                                success: function (response) {
                                    jobDto = dto;
                                    vm.resetModify();
                                    //bootbox.alert(`job saved`);
                                    location.href = "/jobs";
                                },
                                error: function (xhr) {
                                    if (xhr.status === 400) {
                                        var errors = xhr.responseJSON.errors;
                                        if (errors != null) {
                                            var ve_1 = new Object();
                                            errors.filter(function (x) { return x.errorCode == ErrorCode.ValidationError; }).forEach(function (x) { ve_1[x.fieldName] = x.message; });
                                            vm.validator.showErrors(ve_1);
                                        }
                                    }
                                }
                            });
                        }
                        else if (WebClient.model.EditMode === EditMode.Create) {
                            $.ajax({
                                url: '/api/jobs/',
                                type: 'post',
                                dataType: 'json',
                                data: json,
                                contentType: "application/json; charset=utf-8",
                                async: true,
                                success: function (response) {
                                    //bootbox.alert(`job created`);
                                    WebClient.model.EditMode = EditMode.Edit;
                                    //model.JobId = response.data.resourceId;
                                    jobDto = dto;
                                    vm.resetModify();
                                    location.href = "/jobs";
                                }, error: function (xhr) {
                                    if (xhr.status === 400) {
                                        var errors = xhr.responseJSON.errors;
                                        if (errors != null) {
                                            var ve_2 = new Object();
                                            errors.filter(function (x) { return x.errorCode == ErrorCode.ValidationError; }).forEach(function (x) { ve_2[x.fieldName] = x.message; });
                                            vm.validator.showErrors(ve_2);
                                        }
                                    }
                                }
                            });
                        }
                        ;
                        //bootbox.alert(`not implemented yet`);
                    },
                    revertChanges: function () {
                        var vm = this;
                        if (!vm.canRevert)
                            return;
                        WebClient.model.FromDto(jobDto);
                        vm.resetModify();
                    },
                    addParam: function () {
                        var vm = this;
                        if (!vm.canChange)
                            return;
                        if (WebClient.model.JobParameters.some(function (value) {
                            return (value.Name.length === 0 || !value.Name.trim());
                        }))
                            return;
                        WebClient.model.JobParameters.push({ Name: "", Value: "" });
                    },
                    removeParam: function (param, index) {
                        var vm = this;
                        if (!vm.canChange)
                            return;
                        WebClient.model.JobParameters.splice(index, 1);
                    },
                    hourlyMinutes: function () {
                        var result = new Array();
                        for (var i = 0; i < 12; i++) {
                            result.push(i * 5);
                        }
                        return result;
                    }
                },
                //vue js event  
                updated: function () {
                    skipModified = false;
                    $('.sp').selectpicker();
                },
                //vue js event  
                beforeUpdate: function () {
                    if (!skipModified) {
                        if (!WebClient.model.Modified) {
                            WebClient.model.Modified = true;
                        }
                    }
                },
                mounted: function () {
                    var vm = this;
                    skipModified = false;
                    $(jobEditPamaters.selector + "-loading").hide();
                    $(jobEditPamaters.selector).fadeIn();
                    vm.validator = buildBSValidator(jobEditPamaters.selector + ' form');
                    vm.resetModify();
                    skipModified = false;
                },
                watch: {},
                computed: {
                    canSave: function () {
                        return WebClient.model.Modified;
                    },
                    canRevert: function () {
                        return WebClient.model.Modified && WebClient.model.EditMode === EditMode.Edit;
                    },
                    canAddNewParam: function () {
                        var vm = this;
                        if (!vm.canChange)
                            return false;
                        return !(WebClient.model.JobParameters.some(function (value) {
                            return (value.Name.length === 0 || !value.Name.trim());
                        }));
                    },
                    canChange: function () {
                        return !WebClient.model.TaskDisabled;
                    },
                }
            });
            $('.sp').selectpicker();
            window.onbeforeunload = function () {
                if (WebClient.jobEditVue.Modified) {
                    return "You have unsaved changes.  Do you want to leave this page and lose your changes?";
                }
            };
        }
    })(WebClient = Morph.WebClient || (Morph.WebClient = {}));
})(Morph || (Morph = {}));
//# sourceMappingURL=JobEdit.js.map