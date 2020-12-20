import { IResult } from './data';

export enum ENetConf {
    REST = 'http://127.0.0.1:6601',
    FILE = 'http://127.0.0.1:6600',
    // REST = 'http://122.112.251.186:6601', 
    // FILE = 'http://122.112.251.186:6600',
    ASSET = 'http://127.0.0.1:8008',

}
export const _url = (path: EDataPath) => {
    return ENetConf.REST + path;
};
export const _storageurl = (path: string) => { 
    return ENetConf.FILE + '/storage/' + path;
};

export enum EDataPath {

    GETTOKEN = '/sign',
    REGISTER = '/register',
    PROFILE = '/profile',
    UPLOAD = '/upload',

    GETPRODUCTS = '/products',
    GETORDERS = '/orders',
    GETPRODCONF = '/prodconf',

    RMWORKFLOW = '/workflows/rm',
    WORKFLOW = '/workflows',
    SYNCROLES = '/syncroles',
    USERSCHEDS = '/userschedules',
    USERMOVE = '/usercommit',
    USERSTART = '/userstart',
    STARTSCHED = '/startsched',
    STOPSCHED = '/stopsched',
    MOVESCHED = '/movesched',
    GETSCHED = '/getsched',
    GETSCHEDPAGE = '/getschedpage',
    QUERY = '/query',

    SEARCH = '/search',
    LOAD = '/load',
    RESTART = '/restart'
}

export class UseCase {
    debug: boolean = false;
    token: string = '12356789stwegaw';
    captcha: string = '1111';
    mobile: string = '15800000000';
    wf: { [name: string]: string }[] = [];
    '/prodconf' = (params: { [key: string]: string }): IResult => {
        const conf  = [
            {
                id: '22523423',
                size: { x: 900, y: 600 },
                money: 168,
                max: 3,
                desc: '宽900x高600,价格168,共6内页'
            },
            {
                id: '29879233',
                size: { x: 600, y: 900 },
                money: 198,
                max: 3,
                desc: '宽600x高900,价格198,共6内页'
            },
            {
                id: '23233232',
                size: { x: 900, y: 900 },
                money: 298,
                max: 3,
                desc: '宽900x高900,价格298,共6内页'
            }
        ];
        return { code: 'OK', data: { conf: conf } };
    }
    '/sign' = (params: { [key: string]: string }): IResult => {
        if (!params || !params.tk) {
            this.token = Math.round(Math.random() * 100000000).toString();
            return { code: this.token } as any;
        } else if (params.tk == this.token) {
            return { code: 'OK' }
        }
    };
    '/profile' = (params: { [key: string]: string }): IResult => {
        if (!params) {
            return { code: 'OKWITHMORE', data: { avatar: '', addr: '', intro: '' } };
        }
        if (!params.addr) {
            return { code: 'ERR', data: { invalide: 'addr', msg: '地址不能为空' } };
        }
        return { code: 'OK' };
    }
    '/register' = (params: { [key: string]: string }): IResult => {
        if (!params || !params.mobile) {
            return { code: 'ERR', data: { msg: '手机号码不能为空' } };
        }
        if (params.mobile && !params.captcha) {
            if (this.mobile == params.mobile) {
                return { code: 'OKWITHMORE', data: { tk: this.token } };
            } else {
                this.mobile = params.mobile;
                this.captcha = Math.round(Math.random() * 10000).toString();
                return { code: 'OKWITHMORE' };
            }
        } else if (params.mobile && params.captcha) {
            if (this.mobile == params.mobile) {
                if (this.captcha == params.captcha) {
                    return { code: 'OK' };
                } else {
                    return { code: 'ERR', data: { msg: '验证码错' } };
                }
            } else {
                if (this.captcha == params.captcha) {
                    return { code: 'ERR', data: { msg: '手机号码错' } };
                } else {
                    return { code: 'ERR', data: { msg: '手机号码验证码错' } };
                }
            }
        }
    }
    '/workflow' = (params: { [key: string]: string }): IResult => {
        if (!params || Object.keys(params).length === 0) {
            let wf = localStorage.getItem('wf');
            if (!wf) {
                wf = decodeURIComponent("%5B%7B%22name%22%3A%22%E5%AE%A1%E6%89%B9%E6%B5%81%E7%A8%8B%22%2C%22wf%22%3A%22%5B%7B%5C%22label%5C%22%3A%5C%22%E5%8F%91%E8%B5%B7%E4%BA%BA%5C%22%2C%5C%22curr%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22f99f6775-2647-4424-afce-f55892e5087f%5C%22%2C%5C%22optid%5C%22%3A%5C%220%5C%22%2C%5C%22label%5C%22%3A%5C%22%E5%85%A8%E9%83%A8%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%220%5C%22%2C%5C%22name%5C%22%3A%5C%22%E5%85%A8%E9%83%A8%5C%22%7D%7D%2C%5C%22fwd%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22optid%5C%22%3A%5C%22%5C%22%2C%5C%22label%5C%22%3A%5C%22%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22name%5C%22%3A%5C%22%5C%22%7D%7D%7D%2C%7B%5C%22label%5C%22%3A%5C%22%E4%B8%8B%E4%B8%80%E6%AD%A5%5C%22%2C%5C%22curr%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22c9a8ac49-6b12-474a-9edb-c47097a1da69%5C%22%2C%5C%22optid%5C%22%3A%5C%222%5C%22%2C%5C%22label%5C%22%3A%5C%22%E5%9F%BA%E5%9C%B0%E5%85%B3%E9%94%AE%E7%94%A8%E6%88%B7%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%2C%5C%22_CONFIRM%5C%22%3Atrue%2C%5C%22_REJECT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%222%5C%22%2C%5C%22name%5C%22%3A%5C%22%E5%9F%BA%E5%9C%B0%E5%85%B3%E9%94%AE%E7%94%A8%E6%88%B7%5C%22%7D%7D%2C%5C%22fwd%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22optid%5C%22%3A%5C%22%5C%22%2C%5C%22label%5C%22%3A%5C%22%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22name%5C%22%3A%5C%22%5C%22%7D%7D%7D%2C%7B%5C%22label%5C%22%3A%5C%22%E4%B8%8B%E4%B8%80%E6%AD%A5%5C%22%2C%5C%22curr%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22417ccfde-deb8-446a-bd15-bb78189190e5%5C%22%2C%5C%22optid%5C%22%3A%5C%223%5C%22%2C%5C%22label%5C%22%3A%5C%22%E6%9D%BF%E5%9D%97%E7%AE%A1%E7%90%86%E5%91%98%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%2C%5C%22_CONFIRM%5C%22%3Atrue%2C%5C%22_REJECT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%223%5C%22%2C%5C%22name%5C%22%3A%5C%22%E6%9D%BF%E5%9D%97%E7%AE%A1%E7%90%86%E5%91%98%5C%22%7D%7D%2C%5C%22fwd%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22optid%5C%22%3A%5C%22%5C%22%2C%5C%22label%5C%22%3A%5C%22%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22name%5C%22%3A%5C%22%5C%22%7D%7D%7D%2C%7B%5C%22label%5C%22%3A%5C%22%E4%B8%8B%E4%B8%80%E6%AD%A5%5C%22%2C%5C%22curr%5C%22%3A%7B%5C%22id%5C%22%3A%5C%221fe69c20-c1c1-49ef-bd79-a9dcb8743a91%5C%22%2C%5C%22optid%5C%22%3A%5C%224%5C%22%2C%5C%22label%5C%22%3A%5C%22%E9%A9%BB%E5%9C%BA%E9%A1%BE%E9%97%AE%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%2C%5C%22_CONFIRM%5C%22%3Atrue%2C%5C%22_REJECT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%224%5C%22%2C%5C%22name%5C%22%3A%5C%22%E9%A9%BB%E5%9C%BA%E9%A1%BE%E9%97%AE%5C%22%7D%7D%2C%5C%22fwd%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22optid%5C%22%3A%5C%22%5C%22%2C%5C%22label%5C%22%3A%5C%22%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22name%5C%22%3A%5C%22%5C%22%7D%7D%7D%2C%7B%5C%22label%5C%22%3A%5C%22%E4%B8%8B%E4%B8%80%E6%AD%A5%5C%22%2C%5C%22curr%5C%22%3A%7B%5C%22id%5C%22%3A%5C%2286f7e659-94f6-4d4b-958b-87fbfa2d5cb1%5C%22%2C%5C%22optid%5C%22%3A%5C%225%5C%22%2C%5C%22label%5C%22%3A%5C%22ISM%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%2C%5C%22_REJECT%5C%22%3Atrue%2C%5C%22_CONFIRM%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%225%5C%22%2C%5C%22name%5C%22%3A%5C%22ISM%5C%22%7D%7D%2C%5C%22fwd%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22optid%5C%22%3A%5C%22%5C%22%2C%5C%22label%5C%22%3A%5C%22%5C%22%2C%5C%22actions%5C%22%3A%7B%5C%22_COMMIT%5C%22%3Atrue%7D%2C%5C%22cursor%5C%22%3A%7B%5C%22id%5C%22%3A%5C%22%5C%22%2C%5C%22name%5C%22%3A%5C%22%5C%22%7D%7D%7D%5D%22%7D%5D");
            }
            return { code: 'OK', data: JSON.parse(wf) };
        } else {
            this.wf = params as any;
            localStorage.setItem('wf', JSON.stringify(params));
            return { code: 'OK' };
        }
    }
}
