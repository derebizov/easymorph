//TODO: split sthis file into modules
//TODO: join multiple files into one bundle

enum EditMode {
    Create = 1,
    Edit = 2,
    View = 3
}

abstract class ScheduleType {
    public static readonly NoSchedule: string = "NoSchedule";
    public static readonly OnceSchedule: string = "OnceSchedule";
    public static readonly HourlySchedule: string = "HourlySchedule";
    public static readonly DailySchedule: string = "DailySchedule";
}

interface IG11Preferences {
    timeFormat: string;
    dateFormat: string;
    dateTimeFormat: string;
}


//http://stackoverflow.com/questions/12881212/does-typescript-support-events-on-classes
interface ILiteEvent<T> {
    on(handler: { (data?: T): void }): void;
    off(handler: { (data?: T): void }): void;
}




class MorphApi {
    private _baseUrl: string;
    constructor(baseUrl: string = "/") {
        this._baseUrl = baseUrl;
    }




}

interface IErrorDto {
    fieldName: string;
    message: string;
    errorCode: number;
}

enum ErrorCode {
    Undefined = -1,
    Success = 0,
    ValidationError = 1,
    JobIsRunning = 2
}


interface IJobListItemDto {
    jobId: string;
    status: string;
    scheduleAsText: string;
    name: string;
    statusText: string;
    text?: string;
}

interface IJobParameterDto {
    name: string;
    value: string;

}

interface IFullJobDto {
    projectFile: string;
    enabled: boolean;
    generateReport: boolean;
    jobParameters: Array<IJobParameterDto>;
    schedule: {
        scheduleType: string,
        date: any,
        hour: number,
        minute: number,
        daysOfWeek: Array<string>
    }
}

interface IMorphServerSettingDto {
    projectsFolder: string;
    systemFolder: string;    
    logsFolder: string;
    licenseKeyFile: string;
    repositoryFile: string;
}

interface IJobLogDto {
    jobId: string;
    logFileContent: Array<string>;
    errors: Array<IJobLogErrorDto>;
    errorsCount: number;
    lastEventId: number;
    timeStamp: string;
}

interface IServerLogDto {
    logFileContent: Array<string>;
    lastEventId: number;
    timeStamp: string;
}

interface IJobLogErrorDto {
    description: string;
    location: string;
}



interface SignalR {
    notificationsHub: NotificationsHubProxy;
}
interface NotificationsHubProxy {
    client: NotificationsClient;
    server: NotificationsServer;
}

interface NotificationsClient {
    renderTestMessage: (message: string) => void;
    jobsCollectionChanged: (action: string, newItems: Array<string>, oldItems: Array<string>) => void;
    jobLogChanged: (jobId: string, newRecords: Array<string>) => void;
    jobStatusChanged: (jobId: string, jobStatus: string) => void;
    serverLogChanged: (newRecords: Array<string>) => void;


}
interface NotificationsServer {
    send(name: string, message: string): JQueryPromise<void>;
    subscribeJobLogEvents(jobId: string, eventId: number, timestamp: string): JQueryPromise<string[]>;
    subscribeServerLogEvents(eventId: number, timestamp: string): JQueryPromise<string[]>;
    unsubscribeJobLogEvents(jobId: string): JQueryPromise<void>;

}




class NotificationsHubClient {

    private _notificationsHub: NotificationsHubProxy;
    private _connection: any;
    public get NotificationsHub(): NotificationsHubProxy {
        return this._notificationsHub;
    }

    public get IsConnected(): boolean {
        return this._connection.hub && this._connection.hub.state === ($ as any).signalR.connectionState.connected;
    }

    constructor() {

    }
    public init(): void {
        this._connection = ($ as any).connection;
        this._notificationsHub = this._connection.notificationsHub as NotificationsHubProxy;

    }
    public onError(error: any) {
        console.log('SignalR error: ' + error);
    }
     public onDone: () => void


    public start(): void {
        this._connection.hub.logging = true;
        this._connection.error = this.onError;
        this._connection.hub.start().done(this.onDone);
    }


}

interface IKeyedCollection<T> {
    Add(key: string, value: T): void;
    ContainsKey(key: string): boolean;
    Count(): number;
    Item(key: string): T;
    Keys(): string[];
    Remove(key: string): T;
    Values(): T[];
}

class KeyedCollection<T> implements IKeyedCollection<T> {
    private items: { [index: string]: T } = {};

    private count: number = 0;

    public ContainsKey(key: string): boolean {
        return this.items.hasOwnProperty(key);
    }

    public Count(): number {
        return this.count;
    }

    public Add(key: string, value: T) {
        this.items[key] = value;
        this.count++;
    }

    public Remove(key: string): T {
        var val = this.items[key];
        delete this.items[key];
        this.count--;
        return val;
    }

    public Item(key: string): T {
        return this.items[key];
    }

    public Keys(): string[] {
        var keySet: string[] = [];

        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                keySet.push(prop);
            }
        }

        return keySet;
    }

    public Values(): T[] {
        var values: T[] = [];

        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                values.push(this.items[prop]);
            }
        }

        return values;
    }
}


interface String {
    endsWith(suffix: string): boolean;
}


String.prototype.endsWith = function (suffix: string): boolean {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};


function makeAbsolutePath(path: string, value: string): string {
    if (typeof (path) !== "undefined" && value !== null &&value!=="" && path !== null && path.length > 1 && value[1] !== ':') {
        if (!path.endsWith("\\"))
            path = path + "\\";
        return path + value;
    }
    return value;
}
function makeRelativePath(path: string, value: string): string {
    
    if ((value == null) || (path == null) || (typeof(path)==="undefined"))
        return value;
    
    var regEx = new RegExp('^' + escapeRegExp(path), "i");
    if (value.match(regEx) === null) {
        return value;
    }
    let result = value.replace(regEx, '');

    if (result.length > 0 && result[0] === '\\') {
        result = result.substr(1);
    }
    return result;
}
function escapeRegExp(str:string) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}



function buildBSValidator(selector: string): any {
    return ($(selector) as any).validate({

        highlight: function (element: any) {
            $(element).closest('.form-group').addClass('has-error');
        },
        unhighlight: function (element: any) {
            $(element).closest('.form-group').removeClass('has-error');
        },
        errorElement: 'span',
        errorClass: 'help-block',
        errorPlacement: function (error: any, element: any) {
            if (element.parent('.input-group').length) {
                error.insertAfter(element.parent());
            } else {
                error.insertAfter(element);
            }
        }
    });
}