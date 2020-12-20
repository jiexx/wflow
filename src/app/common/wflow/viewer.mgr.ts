
import { v4 as uuid } from 'uuid';
import { Viewer } from "./viewer";

export class ViewerMgr {
    private viewers: {[id:string]: Viewer} ={}

    constructor(){
    }

    getCurrentId(){
        return Viewer.actived.id;
    }
    show(id: string){
        this.viewers[id].show();
    }
    fromModel( models:
        { 
            id: string, name: string, actived: boolean,
            root: { id: string, role: { id: string, name: string } }, 
            xml: string 
        }[]
    ){
        models.forEach(model => {
            this.viewers[model.id] = new Viewer(model.id, model.name);
            this.viewers[model.id].setId(model.id);
            this.viewers[model.id].unserialize(model.xml);
            this.viewers[model.id].setFirst(model.root.id);
            this.viewers[model.id].valid = model.actived; 
            this.show(model.id);
        })
    }
    createViewer(name: string){
        let id = uuid();
        this.viewers[id] = new Viewer(id, name);
        this.viewers[id].createLayer(id);
        this.viewers[id].show()
        return id;
    }
    removeViewer(id: string){
        delete this.viewers[id];
    }
    getViewer(id?: string){
        if(id){
            return this.viewers[id];
        }else if(Viewer.actived && Viewer.actived.id){
            return Viewer.actived;
        }else if(Object.values(this.viewers).length > 0){
            return Object.values(this.viewers)[0]
        } ;
    }
    getViewers(){
        return Object.values(this.viewers)/* .reduce((p,c)=>{
            p.push(c);
            return p;
        }, []); */
    }

}