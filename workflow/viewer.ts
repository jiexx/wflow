import { mxgraph, mxgraphFactory } from "mxgraph-factory";
import { v4 as uuid } from 'uuid';
import { FlowAction } from './planner.model';
import { ViewRef } from '@angular/core';

const { mxGraph, mxGraphModel, mxConnectionHandler,mxHierarchicalLayout,mxMorphing, mxUtils, mxLog, mxCell, mxCodec, mxImage, mxClient, mxEvent, mxEdgeLabelLayout, mxParallelEdgeLayout, mxLayoutManager, mxConstants, mxEdgeStyle, mxDragSource, mxRubberband, mxKeyHandler, mxPerimeter } = mxgraphFactory({
    mxLoadResources: false,
    mxLoadStylesheets: false,
});
declare var ActiveXObject: (type: string) => void;
export class Viewer {
    parse(xml: string) {
        let doc: Document;
        if (DOMParser) {
            let parser = new DOMParser();
            doc = parser.parseFromString(xml, "text/xml");
        } else {
            let xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(xml);
            doc = xmlDoc;
        }
        return doc;
    }

    unserialize(xml: string){
        let doc = mxUtils.parseXml(xml);
        let dec = new mxCodec(doc);
        var elt = doc.documentElement.firstChild;
        var cells = [];

        while (elt != null)
        {
            cells.push(dec.decodeCell(elt));
            elt = elt.nextSibling;
        }

        Viewer.graph.addCells(cells, this.layer);
    }

    setId(id: string){
        let cell = new mxCell();
        cell.setId(id);
        this.layer = Viewer.root.insert(cell);
    }
    setFirst(rootid: string){
        this.first = Viewer.model.getCell(rootid)
    }

    serialize(){
        let enc = new mxCodec();
        let node = enc.encode(Viewer.model.getChildCells(this.layer)/* Viewer.model */);
        let xml = mxUtils.getPrettyXml(node);
        return xml;
    }
    getTasks(){
        let parent = this.layer;
        let tasks = Viewer.model.getChildVertices(parent).filter(i => i.getId().includes('t_')).map(i => ({ id: i.getId(), cell:i, role: { id: i.getAttribute('roleid'), name: i.getAttribute('rolename') }, expire:i.getAttribute('expire'), privilege:i.getAttribute('privilege') }));
        return tasks;
    }
    getTask(id){
        let parent = this.layer;
        let tasks = Viewer.model.getChildVertices(parent).filter(i => i.getId().includes('t_')).filter(i => i.getId() == id).map(i => ({ id: i.getId(), cell:i, role: { id: i.getAttribute('roleid'), name: i.getAttribute('rolename') }, expire:i.getAttribute('expire'), privilege:i.getAttribute('privilege') }));
        return tasks;
    }
    getFlows(taskid: string){
        if(taskid && taskid.includes('t_')) {
            let task = Viewer.model.getCell(taskid);
            if(task){
                let gw = Viewer.model.getCell(taskid).edges.filter(i => i.target.getId().includes('gw_')).map(i=>i.target);
                if(gw.length == 1) {
                    let f = gw[0].edges.filter(i => i.target.getId().includes('t_')).map(i => ({ 
                        id: i.getId(), action: {id: i.getAttribute('label') ? uuid() : FlowAction.NOPEID, name: i.getAttribute('label')}, cell: i,
                        target: {id: i.target.getId(), cell:i.target, role: { id: i.target.getAttribute('roleid'), name: i.target.getAttribute('rolename') }} }));
                    return f;
                }
            }
        }
    }
    getGw(taskid: string){
        if(taskid && taskid.includes('t_')) {
            let task = Viewer.model.getCell(taskid);
            if(task){
                let gw = Viewer.model.getCell(taskid).edges.filter(i => i.target.getId().includes('gw_')).map(i=>i.target);
                if(gw.length == 1) {
                    return gw[0];
                }
            }
        }
    }
    toModel() {
        //let doc: Document = mxUtils.parseXml(this.serialize());
        let parent = this.layer;//Viewer.graph.getDefaultParent();
        if( Viewer.model.getChildEdges(parent).filter(edge => !edge.source || !edge.target || !edge.getId().includes('f_')).length > 0 ){
            return;
        }
        let flows = Viewer.model.getChildEdges(parent).map(i => ({ id: i.getId(), action: { id: i.getAttribute('label') ? uuid() : FlowAction.NOPEID, name: i.getAttribute('label') }, from: i.source.getId(), to: i.target.getId() }));
        
        let tasks = Viewer.model.getChildVertices(parent).filter(i => i.getId().includes('t_')).map(i => ({ id: i.getId(), role: { id: i.getAttribute('roleid'), name: i.getAttribute('rolename') },expire:i.getAttribute('expire'), privilege:i.getAttribute('privilege') }));
        let orgateways = Viewer.model.getChildVertices(parent).filter(i => i.getId().includes('gw_o_')).map(i => ({ id: i.getId() }));
        let andgateways = Viewer.model.getChildVertices(parent).filter(i => i.getId().includes('gw_+_')).map(i => ({ id: i.getId() }));
        return { id: this.id, name: this.name, actived:this.valid, root: { id: this.first.getId(), role: { id: this.first.getAttribute('roleid'), name: this.first.getAttribute('rolename') } }, 
                tasks: tasks, orgateways: orgateways, andgateways: andgateways, flows: flows, xml: this.serialize() };
    }
    setName(n){
        this.name = n;
    }
    setValid(n){
        this.valid = n;
    }
    public valid: boolean = true;
    public preview: boolean = false;
    constructor(public id: string, public name: string) {
    }
    static model: mxgraph.mxGraphModel = null;
    static graph: mxgraph.mxGraph = null;
    static root: mxgraph.mxCell = null;
    static actived: Viewer = null;
    static layout: mxgraph.mxHierarchicalLayout = null;
    layer: mxgraph.mxCell = null;
    first: mxgraph.mxCell = null;
    _selected: mxgraph.mxCell = null;
    onSelectedDblick(id: string){
        this._selected = id.includes('t_') ? Viewer.model.getCell(id) : null; 
    }
    taskSelected(){
        return this._selected && this._selected.id.includes('t_')
    }
    gatewayToggle(id: string){
        let cell = Viewer.model.getCell(id);
        if(id.includes('gw_o_')){
            Viewer.graph.setCellStyles('shape', 'ellipse', [cell])
            delete Viewer.model.cells[cell.getId()];
            cell.setId(id.replace('gw_o_', 'gw_+_'));
            Viewer.model.cells[cell.getId()] = cell;
        }else if(id.includes('gw_+_')){
            Viewer.graph.setCellStyles('shape', 'doubleEllipse', [cell])
            delete Viewer.model.cells[cell.getId()];
            cell.setId(id.replace('gw_+_', 'gw_o_'));
            Viewer.model.cells[cell.getId()] = cell;
        }
    }
    gatewaySelected(){
        return this._selected && this._selected.id.includes('gw_');
    }
    setAction(flowid:string, name: string){
        if(flowid && flowid.includes('f_')) {
            let flow = Viewer.model.getCell(flowid);
            if(flow) {
                flow.setAttribute('label', name);
                Viewer.graph.updateCellSize(flow, false);
                Viewer.graph.refresh();
            }
        }
    }
    setTarget(flowid:string, taskid: string){
        if(flowid && flowid.includes('f_') && taskid && taskid.includes('t_')) {
            let flow = Viewer.model.getCell(flowid);
            let task = Viewer.model.getCell(taskid);
            if(flow && task) {
                flow.setTerminal(task, false);
                Viewer.graph.updateCellSize(flow, false);
                Viewer.graph.refresh();
            }
        }
    }
    setExpire(exp){
        if(!this._selected) {
            return;
        }
        //Viewer.model.setValue(this._selected, rolename)
        
        this._selected.setAttribute('expire', exp);
        Viewer.graph.updateCellSize(this._selected, true);
        Viewer.graph.refresh();
    }
    setPrivilege(priv){
        if(!this._selected) {
            return;
        }
        //Viewer.model.setValue(this._selected, rolename)
        
        this._selected.setAttribute('privilege', priv);
        Viewer.graph.updateCellSize(this._selected, true);
        Viewer.graph.refresh();
    }
    setRole(roleid: string, rolename: string){
        if(!this._selected) {
            return;
        }
        //Viewer.model.setValue(this._selected, rolename)
        
        this._selected.setAttribute('label', rolename);
        this._selected.setAttribute('roleid', roleid);
        this._selected.setAttribute('rolename', rolename);
        Viewer.graph.updateCellSize(this._selected, true);
        Viewer.graph.refresh();
    }
    remove(id?){
        if (Viewer.graph.isEnabled() && id) {
            let cell = Viewer.model.getCell(id)
            Viewer.graph.removeCells([cell]);
            Viewer.graph.refresh();
        }else {
            Viewer.graph.removeCells([this._selected]);
            Viewer.graph.refresh();
        }
    }
    refresh(){
        Viewer.graph.refresh();
    }
    
    executeLayout(change, post, v1, layer = null) {
        
        Viewer.graph.getModel().beginUpdate();
        try {
            if (change != null) {
                change();
            }
            Viewer.layout.execute(layer||Viewer.graph.getDefaultParent(), v1);
        } catch (e){
            throw e;
        }finally{
            // New API for animating graph layout results asynchronously
            var morph = new mxMorphing(Viewer.graph);
            morph.addListener(mxEvent.DONE, mxUtils.bind(this, function() {
                Viewer.graph.getModel().endUpdate();
                if (post != null) {
                    post();
                }
            }));
            morph.startAnimation();
        }
    };
    createTask(label: string, x, y, exp = 2, priv = 'closed'){
        let t = null;
        this.executeLayout(()=> {
            let id = 't_'+uuid();
            let node = mxUtils.createXmlDocument().createElement('node')
            node.setAttribute('label', label);
            node.setAttribute('expire', exp);
            node.setAttribute('privilege', priv);
            t = Viewer.graph.insertVertex(this.layer, id, node, x, y, 1, 1, 'rounded=1;whiteSpace=wrap;html=1;gradientDirection=north;gradientColor=#E6E6E6;perimeterSpacing=1;strokeColor=#808080;autosize=0;container=0;snapToPoint=1;shadow=1;fontStyle=1;labelPadding=100;editable=0;perimeter=ellipsePerimeter;rotatable=0;cloneable=0;resizable=0;');
            let preferred = Viewer.graph.getPreferredSizeForCell(t);
            let current = t.getGeometry();
            current.width = preferred.width;
            current.height = preferred.height;
        }, ()=> {
            Viewer.graph.scrollCellToVisible(t);
        }, t, this.layer);
        return t;
    }
    createOrGateway(x, y, id?:string){
        let gw = null;
        this.executeLayout(()=> {
            id = id ? id : 'gw_o_'+uuid();
            let node = mxUtils.createXmlDocument().createElement('node')
            node.setAttribute('label', '');
            gw = Viewer.graph.insertVertex(this.layer, id, node, x, y, 30, 30, 'shape=doubleEllipse;whiteSpace=wrap;html=1;aspect=fixed;shadow=0;strokeColor=#808080;gradientColor=#E6E6E6;shadow=1;rotatable=0;cloneable=0;editable=0;resizable=0;');
        }, ()=> {
            Viewer.graph.scrollCellToVisible(gw);
        }, gw, this.layer);
        return gw;
    }
    createAndGateway(x, y, id?:string){
        id = id ? id : 'gw_+_'+uuid();
        let node = mxUtils.createXmlDocument().createElement('node')
        node.setAttribute('label', '');
        let gw = Viewer.graph.insertVertex(this.layer, id, node, x, y, 30, 30, 'shape=orEllipse;whiteSpace=wrap;html=1;aspect=fixed;shadow=0;strokeColor=#808080;gradientColor=#E6E6E6;shadow=1;rotatable=0;cloneable=0;editable=0;resizable=0;');
        return gw;
    }
    getFlow(flowid){
        let parent = this.layer;
        let flows = Viewer.model.getChildEdges(parent).filter(i => i.getId().includes('f_')).filter(i => i.getId() == flowid).map(i => ({ id: i.getId(), cell:i, label:  i.getAttribute('label')}));
        return flows;
    }
    createFlow(label: string, source, target, style){
        let id = 'f_'+uuid();
        let node = mxUtils.createXmlDocument().createElement('node')
        node.setAttribute('label', label);
        let e =  Viewer.graph.insertEdge(this.layer, id, node, source, target, style);
        return e;
    }
    
    createLayer(id: string){
        Viewer.graph.getModel().beginUpdate();
        try {
            let cell = new mxCell();
            cell.setId(id);
            this.layer = Viewer.root.insert(cell);
            this.first = this.createTask('请双击选择角色', 20, 120);
        }
        finally {
            // Updates the display
            Viewer.graph.getModel().endUpdate();
        }
        
    }
    show(){
        if(Viewer.actived){
            Viewer.model.setVisible(Viewer.actived.layer, false);
        }
        Viewer.model.setVisible(this.layer, true);
        Viewer.actived = this;
    }
    render(){
        Viewer.graph.getModel().beginUpdate();
        try {
            
        }
        finally {
            // Updates the display
            Viewer.graph.getModel().endUpdate();
        }
    }
    static config(container: HTMLDivElement) {
        Viewer.model = null;
        Viewer.graph = null;
        Viewer.root = null;
        Viewer.actived = null;
        Viewer.layout = null;
        //if(!Viewer.root){
            Viewer.root = new mxCell(100);
        //}
        //if(!Viewer.model){
            Viewer.model = new mxGraphModel(Viewer.root);
        //}
        //if(!Viewer.graph){
            Viewer.graph = new mxGraph(container, Viewer.model);
        //}
            Viewer.layout = new mxHierarchicalLayout(Viewer.graph, mxConstants.DIRECTION_WEST);
        Viewer.actived = null;
        
        mxLog.DEBUG = false;
        let graphGetPreferredSizeForCell = Viewer.graph.getPreferredSizeForCell;
        Viewer.graph.getPreferredSizeForCell = function(cell){
            var result = graphGetPreferredSizeForCell.apply(this, arguments);
            if(result){
                result.width += 10;
                result.height += 10;
            }
            return result;
        };
        Viewer.graph.convertValueToString = (cell) => {
            if (mxUtils.isNode(cell.value, cell.name)) {
                return cell.getAttribute('label', '')
            }
        };
        let cellLabelChanged = Viewer.graph.cellLabelChanged;
        Viewer.graph.cellLabelChanged = function(cell, newValue, autoSize) {
            if (mxUtils.isNode(cell.value, cell.name)) {
                //let elt = cell.value.cloneNode(true);
                cell.value.setAttribute('label', newValue);
                arguments[1] = cell.value;
            }
            cellLabelChanged.apply(this, arguments);
        };
        mxConnectionHandler.prototype.connectImage = new mxImage('../assets/img/connector.gif', 16, 16);
        //mxConnectionHandler.prototype.addListener(mxEvent.CONNECT, (sender, evt) => {
        Viewer.graph.connectionHandler.addListener(mxEvent.CONNECT, (sender, evt) => {
            let edge = evt.getProperty('cell');
            if(edge.target  && edge.target.id.includes('t_') && edge.source.id.includes('t_')) {
                Viewer.model.remove(edge);
                return;
            }
            if(edge.source.id.includes('t_') && edge.geometry.targetPoint && Viewer.actived){
                edge.target = Viewer.actived.createOrGateway(edge.geometry.targetPoint.x, edge.geometry.targetPoint.y)
            }else if(edge.source.id.includes('gw_') && edge.geometry.targetPoint && Viewer.actived){
                edge.target = Viewer.actived.createTask('请双击选择角色', edge.geometry.targetPoint.x, edge.geometry.targetPoint.y)
            }
        });
        mxConnectionHandler.prototype.insertEdge = (parent, id, value, source, target, style)=>{
            value = source.id.includes('gw_') ? '请输入角色操作': '';
            return Viewer.actived ? Viewer.actived.createFlow(value, source, target, style) : null;
        };

        if(mxClient.isBrowserSupported()) {
            container.style.position = 'absolute';
            container.style.overflow = 'hidden';
            container.style.left = '0px';
            container.style.top = '0px';
            container.style.right = '0px';
            container.style.bottom = '0px';
            // container.style.background = 'url("./assets/img/grid.gif")';
            // Disables built-in context menu
            mxEvent.disableContextMenu(container);

            // Enables tooltips, new connections and panning
            Viewer.graph.setPanning(true);
            Viewer.graph.setTooltips(true);
            Viewer.graph.setConnectable(true);

            // Automatically handle parallel edges
            var layout = new mxEdgeLabelLayout(Viewer.graph, 1);//new mxParallelEdgeLayout(Viewer.graph);
            var layoutMgr = new mxLayoutManager(Viewer.graph);

            layoutMgr.getLayout = (cell) => {
                if (cell.getChildCount() > 0) {
                    return layout;
                }
            };

            // Enables rubberband (marquee) selection and a handler
            // for basic keystrokes (eg. return, escape during editing).
            // mxRubberband.prototype.destroy();
            // var rubberband = new mxRubberband(Viewer.graph);
            mxKeyHandler.prototype.destroy();
            var keyHandler = new mxKeyHandler(Viewer.graph);
            keyHandler.bindKey(46, (evt) => {
                if (Viewer.graph.isEnabled()) {
                    //Viewer.graph.removeSelectionCell(this.root)
                    //that.graph.getSelectionCells();
                    Viewer.graph.removeCells();
                    Viewer.graph.refresh();
                }
            });
            // Changes the default style for edges "in-place" and assigns
            // an alternate edge style which is applied in mxGraph.flip
            // when the user double clicks on the adjustment control point
            // of the edge. The ElbowConnector edge style switches to TopToBottom
            // if the horizontal style is true.
            let style = Viewer.graph.getStylesheet().getDefaultEdgeStyle();
            style[mxConstants.STYLE_ROUNDED] = true;
            style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
            style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#FFFFFF';
            style[mxConstants.CURSOR_LABEL_HANDLE] = 'text'
            style[mxConstants.STYLE_EDITABLE] = 1;

            Viewer.graph.alternateEdgeStyle = 'elbow=vertical';

            // style = Viewer.graph.getStylesheet().getDefaultVertexStyle();
            // style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
            // style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
            // style[mxConstants.STYLE_STROKECOLOR] = 'gray';
            // style[mxConstants.STYLE_ROUNDED] = true;
            // style[mxConstants.STYLE_FONTCOLOR] = '#000000';
            // style[mxConstants.STYLE_FILLCOLOR] = '#EEEEEE';
            // style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
            // style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
            // style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
            // style[mxConstants.STYLE_FONTSIZE] = '12';
            // style[mxConstants.STYLE_FONTSTYLE] = 1;
            // style[mxConstants.CURSOR_LABEL_HANDLE] = 'text'
            // style[mxConstants.STYLE_EDITABLE] = 0;

            // Installs a custom tooltip for cells
            Viewer.graph.getTooltipForCell = function (cell) {
                return 'Doubleclick and right- or shiftclick';
            }
            Viewer.graph.addListener(mxEvent.DOUBLE_CLICK, (sender, evt) => {
                const cell = evt.getProperty('cell');
                container.focus();
                if(cell && cell.id && cell.id.includes('gw_') && Viewer.actived) {
                    Viewer.actived.gatewayToggle(cell.id);
                }else if(Viewer.actived) {
                    Viewer.actived._selected = null;
                }
            })
            Viewer.graph.addListener(mxEvent.CLICK, (sender, evt) => {
                const cell = evt.getProperty('cell');
                container.focus();
                if(cell && cell.id && (cell.id.includes('t_') || cell.id.includes('gw_') && Viewer.actived)) {
                    Viewer.actived.onSelectedDblick(cell.id);
                }else if(Viewer.actived){
                    Viewer.actived._selected = null;
                }
            })
            
        }
    };

}