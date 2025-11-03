export namespace config {
	
	export class S3Config {
	    id: string;
	    name: string;
	    endpoint: string;
	    accessKey: string;
	    secretKey: string;
	    region: string;
	    bucket: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new S3Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.endpoint = source["endpoint"];
	        this.accessKey = source["accessKey"];
	        this.secretKey = source["secretKey"];
	        this.region = source["region"];
	        this.bucket = source["bucket"];
	        this.description = source["description"];
	    }
	}

}

export namespace rclone {
	
	export class FileInfo {
	    Name: string;
	    Path: string;
	    Size: number;
	    // Go type: time
	    ModTime: any;
	    IsDir: boolean;
	    MimeType: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Path = source["Path"];
	        this.Size = source["Size"];
	        this.ModTime = this.convertValues(source["ModTime"], null);
	        this.IsDir = source["IsDir"];
	        this.MimeType = source["MimeType"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MountInfo {
	    name: string;
	    remote: string;
	    localPath: string;
	    pid: number;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new MountInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.remote = source["remote"];
	        this.localPath = source["localPath"];
	        this.pid = source["pid"];
	        this.status = source["status"];
	    }
	}

}

