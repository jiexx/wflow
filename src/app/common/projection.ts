export interface IVector2d {
    x: number;
    y: number;
};
interface IMatrix2d {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};
interface IMultiply2d {
    (v1: IVector2d, v2: IMatrix2d): IVector2d;
};
interface IAdd2d {
    (v1: IVector2d, v2: IVector2d): IVector2d;
};
interface IScale2d {
    (v: IVector2d, scale: IVector2d): IVector2d;
};
interface ITranslate2d {
    (v: IVector2d, distance: IVector2d): IVector2d;
};
interface IRotate2d {
    (v: IVector2d, delta: number): IVector2d;
};
/*
translate(x,y) =[x,y];
scale(sx,sy) = [(sx,0),(0,sy)];
shear_x(s) = [(1,s),(0,1)];
shear_y(s) = [(1,0),(s,1)];
rotate(d) = [(cos(d), -sin(d)), (sin(d), cos(d))]
X = Rotate*Scale*x + Translate
*/
const multiply2d: IMultiply2d = (v: IVector2d, m: IMatrix2d): IVector2d => {
    return { x : v.x * m.x1 + v.y * m.y1, y : v.x * m.x2 + v.y * m.y2 };
}
const add2d: IAdd2d = (v1: IVector2d, v2: IVector2d): IVector2d => {
    return { x : v1.x + v2.x, y : v1.y + v2.y };
}
const scale2d: IScale2d = (v: IVector2d, scale: IVector2d): IVector2d => {
    return multiply2d(v, { 
        x1 : scale.x, y1 : 0, 
        x2 : 0,       y2 : scale.y
    });
}
const translate2d: ITranslate2d = (v: IVector2d, distance: IVector2d): IVector2d => {
    return add2d(v, distance);
}
const rotate2d: IRotate2d = (v: IVector2d, delta: number): IVector2d => {
    let sin = Math.sin(delta), cos = Math.cos(delta);
    return multiply2d(v, {
        x1 : cos, y1 : -sin,
        x2 : sin, y2 : cos,
    });
}

type Options = 'auto' | 'cover' | 'contain' | string /* "100% 100%" */;

export class Projection {
    constructor(protected image: IVector2d, protected container: IVector2d, protected opt: Options = 'auto', protected center: IVector2d = { x : 0, y : 0 }){
    }
    get ratio(){
        return this[this.opt](
            this.container.x / this.image.x,
            this.container.y / this.image.y
        )
    }
    transform() : { o1 : IVector2d, o2: IVector2d } {
        return {
            o1 : scale2d(translate2d({ x : 0, y : 0 }, this.center), this.ratio), 
            o2 : scale2d(translate2d(this.image, this.center), this.ratio) 
        };
    }
    auto = () : IVector2d => {
        return { x : 1, y : 1};
    };
    cover = (wRatio : string, hRatio : string) : IVector2d => {
        return { x : Math.max(parseFloat(wRatio), parseFloat(hRatio)), y : Math.max(parseFloat(wRatio), parseFloat(hRatio))};
    }
    contain = (wRatio : string, hRatio : string) : IVector2d  => {
        return { x : Math.min(parseFloat(wRatio), parseFloat(hRatio)), y : Math.min(parseFloat(wRatio), parseFloat(hRatio))};
    }
    percentage = (wRatio : string, hRatio : string) : IVector2d  => {
        return { x : parseFloat(wRatio.replace('%',''))/100, y : parseFloat(hRatio.replace('%',''))/100  };
    }
}