import { IVector2d } from "app/common/projection";

export interface IPageConf {
    fill: 'full' | 'none';
    text: string;
    arrange: 1 | 2 | 3;
    background: string;
    url: string;
}

export interface IProductConf {
    id: string;
    size: IVector2d;
    money: number;
    max: 3 | 10 | 20;
    desc: string;
}

export interface IProduct {
    id ?: string;
    time ?: string;
    pages: IPageConf[];
    conf: IProductConf;
}

export interface IUserWork {
    userId: string;
    total: number;
    pageNumber: number;
    products: IProduct[];
}