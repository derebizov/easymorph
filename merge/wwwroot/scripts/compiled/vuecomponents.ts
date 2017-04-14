import * as Vue from "vue";



Vue.component('filepicker', {
    props: ['value', 'pickertype', 'scope', 'placeholder', 'name', 'disabled', 'header', 'browseTitle','startingPath'],
    template:
    '<div class="input-group"><input type="text" ref="input" :name="name" :placeholder="placeholder" :disabled="disabled" class="form-control"   v-bind:value="value"  v-on:input="updateValue($event.target.value)"> \
                <span class="input-group-btn"><a href="javascript:;" class="btn btn-default" @click="showFilePicker"  :disabled="disabled">{{browseTitle}}</a>  </span>\
                <transition name="modal" v-if="modal">\
                 <div class="jstreewrapper1">\
                                    <div class="modal-mask">\
                                        <div class="modal-wrapper">\
                                            <div class="modal-container">\
                                                <div class="modal-header">\
                                                    <slot name="header">\
                                                        {{header}}<br/>\
                                                        {{selectedIdTrimed}}<br/>\
                                                    </slot>\
                                                </div>\
                                                <div class="modal-body">\
                                                    <slot name="body">\
                                                        <div class="jstreewrapper">\
                                                            <div class="jstree_picker"></div>\
                                                        </div>\
                                                    </slot>\
                                                </div>\
                                                <div class="modal-footer">\
                                                    <slot name="footer">\
                                                        <a href="javascript:;" class="btn btn-primary" :disabled="!canSave" @click="saveChanges">Select</a>\
                                                        <a href="javascript:;" class="btn btn-default"  @click = "cancelChanges">Cancel</a>\
                                                    </slot>\
                                                </div>\
                                            </div>\
                                        </div>\
                                    </div>\
                                </div>\
                        </transition></div>',
    data: function():any{
        return {
            modal: false,
            selectedId: (this as any).value,
            selectedType: null,
            jstree: null

        }
    },
    computed: {
        canSave: function (): boolean {
            let vm = this as any;
            return vm.selectedId !== null && vm.selectedId !== "" && (vm.pickertype === vm.selectedType);
        },
        selectedIdTrimed: function (): string {
            let vm = this as any;
            if (vm.selectedId != null && vm.startingPath != null) {
                return vm.selectedId.replace(vm.startingPath,'');
            }
            return vm.selectedId;            
        }
    },

    methods: {
        saveChanges: function ():void{
            let vm = this as any;
            if (!vm.canSave) {
                return;
            }
            vm.updateValue(vm.selectedId);
            vm.dropJsTree();
            vm.modal = false;
        },
        cancelChanges: function (): void {
            let vm = this as any;

            vm.dropJsTree();
            vm.modal = false;
        },
        dropJsTree: function (): void {
            let vm = this as any;
            if (vm.jstree != null) {
                vm.jstree.destroy();
                vm.jstree = null;
            }
        },
        showFilePicker: function (): void {
            let vm = this as any;
            if (vm.disabled)
                return;
            

            vm.modal = true;
            

            Vue.nextTick(function () {
                let control = $(vm.$el).find(".jstree_picker");
                control.on('changed.jstree', function (e, data) {

                    if (data.selected != null && data.selected.length > 0) {
                        vm.selectedId = data.instance.get_node(data.selected[0]).id;
                        vm.selectedType = data.instance.get_node(data.selected[0]).type;
                    };

                });
                control.on('loaded.jstree', function (event, data) {
                  
                    let absolutePath = makeAbsolutePath(vm.startingPath, vm.value);
                    if (absolutePath == null) {
                        return;
                    }
                    let pathParts = absolutePath.split("\\");
                    control.jstree('open_node', "root", function (e: any, d: any) {

                    }, false);
                    
                    let path: string = null;
                    for (var q in pathParts) {
                        if (path != null) {
                            path = path + "\\" + pathParts[q];
                        }
                        else {
                            path = pathParts[q];
                        }

                        console.log(path);
                        control.jstree('open_node',path , function (e: any, d: any) {

                        },false);
                    }
                    control.jstree('select_node', path, function (e: any, d: any) {

                    });
                    }); 

                control.jstree({
                    "types": {
                        "file": {
                            "icon": "jstree-file"
                        },
                        "directory": {
                            "icon": "jstree-folder"
                        }
                    },
                    "plugins": ["types"],
                    'core': {
                        'themes': {
                            'dots': false
                        },
                        "multiple": false,
                        'data': {
                            "url": "/api/filepicker/list?scope=" + vm.scope + "&selected=" + encodeURIComponent(makeAbsolutePath(vm.startingPath, vm.value)),
                            "data": function (node: any) {
                                //return { "id" : node.id };
                                
                                return node;


                            },
                            "error": function (jqXHR: any, textStatus: any, errorThrown: any) {
                                if (jqXHR.status == 400) {


                                    let node = control.find("[id='" + jqXHR.responseJSON.id + "']");
                                    console.log(node);
                                    control.jstree('set_text', node, "ddddd");

                                }
                                //console.log(jqXHR);
                                //console.log(textStatus);
                                //console.log(errorThrown);
                                //$('#YourTree').html("<h3>There was an error while loading data for this tree</h3><p>" + jqXHR.responseText + "</p>");
                            }
                        }
                    }

                });                
                vm.jstree = $(vm.$el).find(".jstree_picker").jstree(true);
                
                
            });

            
        },
        updateValue: function (value) {
            //var formattedValue = value
            //    // Remove whitespace on either side
            //    .trim();
                
            //// If the value was not already normalized,
            //// manually override it to conform
            //if (formattedValue !== value) {
            //    (this as any).$refs.input.value = formattedValue
            //}
            //// Emit the number value through the input event

            let vm = this as any;
            var val = makeRelativePath(vm.startingPath, value);
            this.$emit('input', val)
        }
    }
    
}
);




Vue.component('bs-datepicker', {
    props: ['value', 'name', 'format', 'stepping', 'disabled'],
    template: '<div class="input-group date" > \
            <input type="text" :name="name"  class="form-control" /> \
            <span class="input-group-addon"> \
            <span class="glyphicon glyphicon-calendar"></span> \
            </span> \
            </div>',
    watch: {
        // when the value fo the input is changed from the parent,
        // the value prop will update, and we pass that updated value to the plugin.
        value: function (value) {
            // update value
            if (typeof (value) == "boolean") {
                return;
            }
            
            let control = $(this.$el).data("DateTimePicker");
            control.date(value);
        },
        format: function (value) {
            let control = $(this.$el).data("DateTimePicker");
            control.format(value);
            
        },
        disabled: function (value) {
            let control = $(this.$el).data("DateTimePicker");
            if (value) {
                control.disable();
            }
            else {
                control.enable();
            }
        }

    },

    mounted: function () {

        var vm = this as any;

        let options: any = {
            format: vm.format,
            stepping: parseInt(vm.stepping || "1"),
            ignoreReadonly: true,
            sideBySide: true
        };
        

        ($(this.$el) as any)
            .datetimepicker(options)
            // emit event on change.
            .on("dp.change", vm.onChange);

        let control = $(this.$el).data("DateTimePicker");
        if (vm.disabled) {
            control.disable();
        }
        else {
            control.enable();
        }
        if (vm.value !== null) {
            control.date(vm.value);
        }

    },
    destroyed: function () {
        
        $(this.$el).data("DateTimePicker").destroy();
    },
    methods: {
        // callback for when the selector popup is closed.
        onChange(d: any) {
            this.$emit('input', d.date);
        }
    }

});