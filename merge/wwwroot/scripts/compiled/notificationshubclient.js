//TODO: split sthis file into modules
//TODO: join multiple files into one bundle
var EditMode;
(function (EditMode) {
    EditMode[EditMode["Create"] = 1] = "Create";
    EditMode[EditMode["Edit"] = 2] = "Edit";
    EditMode[EditMode["View"] = 3] = "View";
})(EditMode || (EditMode = {}));
var ScheduleType = (function () {
    function ScheduleType() {
    }
    return ScheduleType;
}());
ScheduleType.NoSchedule = "NoSchedule";
ScheduleType.OnceSchedule = "OnceSchedule";
ScheduleType.HourlySchedule = "HourlySchedule";
ScheduleType.DailySchedule = "DailySchedule";
var MorphApi = (function () {
    function MorphApi(baseUrl) {
        if (baseUrl === void 0) { baseUrl = "/"; }
        this._baseUrl = baseUrl;
    }
    return MorphApi;
}());
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["Undefined"] = -1] = "Undefined";
    ErrorCode[ErrorCode["Success"] = 0] = "Success";
    ErrorCode[ErrorCode["ValidationError"] = 1] = "ValidationError";
    ErrorCode[ErrorCode["JobIsRunning"] = 2] = "JobIsRunning";
})(ErrorCode || (ErrorCode = {}));
var NotificationsHubClient = (function () {
    function NotificationsHubClient() {
    }
    Object.defineProperty(NotificationsHubClient.prototype, "NotificationsHub", {
        get: function () {
            return this._notificationsHub;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NotificationsHubClient.prototype, "IsConnected", {
        get: function () {
            return this._connection.hub && this._connection.hub.state === $.signalR.connectionState.connected;
        },
        enumerable: true,
        configurable: true
    });
    NotificationsHubClient.prototype.init = function () {
        this._connection = $.connection;
        this._notificationsHub = this._connection.notificationsHub;
    };
    NotificationsHubClient.prototype.onError = function (error) {
        console.log('SignalR error: ' + error);
    };
    NotificationsHubClient.prototype.start = function () {
        this._connection.hub.logging = true;
        this._connection.error = this.onError;
        this._connection.hub.start().done(this.onDone);
    };
    return NotificationsHubClient;
}());
var KeyedCollection = (function () {
    function KeyedCollection() {
        this.items = {};
        this.count = 0;
    }
    KeyedCollection.prototype.ContainsKey = function (key) {
        return this.items.hasOwnProperty(key);
    };
    KeyedCollection.prototype.Count = function () {
        return this.count;
    };
    KeyedCollection.prototype.Add = function (key, value) {
        this.items[key] = value;
        this.count++;
    };
    KeyedCollection.prototype.Remove = function (key) {
        var val = this.items[key];
        delete this.items[key];
        this.count--;
        return val;
    };
    KeyedCollection.prototype.Item = function (key) {
        return this.items[key];
    };
    KeyedCollection.prototype.Keys = function () {
        var keySet = [];
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                keySet.push(prop);
            }
        }
        return keySet;
    };
    KeyedCollection.prototype.Values = function () {
        var values = [];
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                values.push(this.items[prop]);
            }
        }
        return values;
    };
    return KeyedCollection;
}());
String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
function makeAbsolutePath(path, value) {
    if (typeof (path) !== "undefined" && value !== null && value !== "" && path !== null && path.length > 1 && value[1] !== ':') {
        if (!path.endsWith("\\"))
            path = path + "\\";
        return path + value;
    }
    return value;
}
function makeRelativePath(path, value) {
    if ((value == null) || (path == null) || (typeof (path) === "undefined"))
        return value;
    var regEx = new RegExp('^' + escapeRegExp(path), "i");
    if (value.match(regEx) === null) {
        return value;
    }
    var result = value.replace(regEx, '');
    if (result.length > 0 && result[0] === '\\') {
        result = result.substr(1);
    }
    return result;
}
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function buildBSValidator(selector) {
    return $(selector).validate({
        highlight: function (element) {
            $(element).closest('.form-group').addClass('has-error');
        },
        unhighlight: function (element) {
            $(element).closest('.form-group').removeClass('has-error');
        },
        errorElement: 'span',
        errorClass: 'help-block',
        errorPlacement: function (error, element) {
            if (element.parent('.input-group').length) {
                error.insertAfter(element.parent());
            }
            else {
                error.insertAfter(element);
            }
        }
    });
}
//# sourceMappingURL=notificationshubclient.js.map