import { HttpRequest, HttpHandler, HttpEvent, HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { EDataPath, _url, UseCase } from './path';
import { ChangeDetectorRef } from '@angular/core';





interface IResultData {
    
}

export interface IResult {
    code : 'OK' | 'ERR' | 'OKWITHMORE';
    data ?: {[key : string] : any};
}

interface IRemote {
    download( path : EDataPath, param : {}, success : ( res : IResult) => void, error : (res : IResult) => void ) : void;
    downloadSync( path : EDataPath, param : {} ) : Promise<IResult>;
    postSync( path : EDataPath, param : {} ) : Promise<IResult>;
    sign( param ?: {} ) : Promise<{  code: string }>;
    upload( path : EDataPath, param : {}, success : ( res : IResult) => void, error : (res : IResult) => void ) : void;
    uploadSync( param : {} ) : Promise<IResult>;
    authorize(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
    error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}

interface IDataStorage {
    save( key : string , value : {}) : void;
    keep( key : string , value : {}) : void;
    remove( mode : 'save' | 'keep', key : string ) : void;
    get( mode : 'save' | 'keep', key : string ) : {};
}
class DataStorage implements IDataStorage{
    storage = {};
    save(key: string, value: {}): void {
        this.storage[key] = value;
    }    
    keep(key: string, value: {}): void {
        this.storage[key] = value;
    }
    remove(mode: "save" | "keep", key: string): void {
        delete this.storage[key]
    }
    get(mode: "save" | "keep", key: string): {} {
        return this.storage[key];
    }

    
}

class CRemote implements IRemote {
    constructor(private http: HttpClient,  private storage: IDataStorage, public isLoading = false){

    };

    download(path: EDataPath, param: {}, success: (res: IResult) => void, error: (res: IResult) => void): void {
        throw new Error("Method not implemented.");
    } 
    downloadSync(path: EDataPath, param: {}): Promise<IResult> {
        throw new Error("Method not implemented.");
    }
    async getSync(url, param){
        return new Promise((resolve, reject) => {
            this.http.post(url, param, this.option()).subscribe((result : IResult) =>{
                this.isLoading = false;
                return resolve(result);
            })
        });
    }
    async postSync(path: EDataPath, param: {}): Promise<IResult> {
        this.isLoading = true;
        return new Promise((resolve, reject) => {
            const uc = new UseCase();
            if(uc.debug) {
                return resolve(uc[path](param));
            }else{
                this.http.post(_url(path), param, this.option()).subscribe((result : IResult) =>{
                    this.isLoading = false;
                    return resolve(result);
                })
            }
        })
    }
    async sign(param?: {}): Promise<{ code: string }> {
        return await this.postSync(EDataPath.GETTOKEN, param);
    }
    upload(path: EDataPath, param: {}, success: (res: IResult) => void, error: (res: IResult) => void): void {
        throw new Error("Method not implemented.");
    }
    async uploadSync(param: {}): Promise<IResult> {
        return await this.postSync(EDataPath.UPLOAD, param);
    }
    authorize(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        throw new Error("Method not implemented.");
    }
    error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        throw new Error("Method not implemented.");
    }
    option(){
        return this.storage.get('save','tk') ? { headers: new HttpHeaders({  Authorization: `Bearer ${this.storage.get('save','tk')}` }) } : {};
    }
}

export class Data {
    
    remote : CRemote;
    storage : IDataStorage;

    constructor(http: HttpClient){
        this.storage = new DataStorage();
        this.remote = new CRemote(http, this.storage);
    }
    
}

