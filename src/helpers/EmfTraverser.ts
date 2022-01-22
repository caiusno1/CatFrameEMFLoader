import { EMFEdge } from "../DataClasses/EMFEdge"
import { EMFObject } from "../DataClasses/EMFObject"

export class EmfTraverser{
    public emfDfs(emfXMLModel:any,configuration: any, collection:EMFObject[] = [], xpath = "#/", returnOnAttribute=true, dynamicState:any = {}):EMFObject[]|EMFEdge[]|[EMFEdge,EMFObject][]{
        const props = Object.getOwnPropertyNames(emfXMLModel)
        const staticState = configuration.staticContextSetter(dynamicState)
        for(const prop of props){
            if(prop.startsWith('@_')){
                configuration.attributeSetter(staticState,emfXMLModel[prop], prop, collection)
            }
            else if(Array.isArray(emfXMLModel[prop])){
                let childIdx = 0
                for(const item of emfXMLModel[prop]){
                    configuration.itemHandler(staticState, item, prop, childIdx, collection, xpath)
                    this.emfDfs(item, configuration, collection,xpath+"/@"+prop+"."+childIdx, returnOnAttribute, staticState)
                    configuration.staticToDynamicState(dynamicState, staticState)
                    childIdx = childIdx + 1;
                }
            } else {
                configuration.itemHandler(staticState, emfXMLModel[prop], prop, -1 , collection, xpath)
                this.emfDfs(emfXMLModel[prop], configuration, collection, xpath+"/"+prop, returnOnAttribute, staticState)
                configuration.staticToDynamicState(dynamicState, staticState)
            }
        }
        return collection
    }
    public objectHandler(dynamicParameters: any, item:any, prop:any, childIdx:number, collection:EMFObject[] = [], xpath = "#/"){
        const obj = new EMFObject()
        if(item['@_xsi:type']){
            obj.name = item['@_xsi:type']
        } else {
            obj.name = prop
        }
        if(childIdx === -1 ){
            obj.id = xpath+"/"+prop
        }
        else {
            obj.id = xpath+"/@"+prop+"."+childIdx
        }
        collection.push(obj)
    }
    public edgeHandler(dynamicParameters: any, item:any, prop:any, childIdx:number, collection:EMFObject[] = [], xpath = "#/"){
        if(dynamicParameters.currentIdx.idx === -1){
            dynamicParameters.currentIdx.idx = 0
        }
        else{
            const edge = new EMFEdge()
            edge.id = "("+prop.replace("@_","")+")"+dynamicParameters.nodeSet[dynamicParameters.parentIdx.idx].id+"->"+dynamicParameters.nodeSet[dynamicParameters.currentIdx.idx + 1].id
            edge.name = prop.replace("@_","")
            dynamicParameters.currentIdx.idx ++;
            collection.push(edge)
        }
    }
    public edgeSrcHandler(dynamicParameters: any, item:any, prop:any, childIdx:number, collection:[EMFEdge,EMFObject][] = [], xpath = "#/"){
        if(dynamicParameters.currentIdx.idx === -1){
            dynamicParameters.currentIdx.idx = 0
        }
        else{
            const edgeSrc = [dynamicParameters.edgeSet[collection.length],dynamicParameters.nodeSet[dynamicParameters.parentIdx.idx]] as [EMFEdge,EMFObject]
            dynamicParameters.currentIdx.idx ++;
            collection.push(edgeSrc)
        }
    }
    public edgeTrgHandler(dynamicParameters: any, item:any, prop:any, childIdx:number, collection:[EMFEdge,EMFObject][] = [], xpath = "#/"){
        if(dynamicParameters.currentIdx.idx === -1){
            dynamicParameters.currentIdx.idx = 0
        }
        else{
            const edgeSrc = [dynamicParameters.edgeSet[collection.length],dynamicParameters.nodeSet[dynamicParameters.currentIdx.idx + 1]] as [EMFEdge,EMFObject]
            dynamicParameters.currentIdx.idx ++;
            collection.push(edgeSrc)
        }
    }

    public noneContextInitializer(dynamicParameters: any, item:any, prop:any, childIdx:number, collection:EMFObject[] = [], xpath = "#/"){
        return {}
    }
    // tslint:disable-next-line:no-empty
    public noneCrossReferenceLoader(dynamicParameters: any, item: any, prop: any, collection: any[]){}

    public defaultCrossReferenceLoader(dynamicParameters: any, item: any, prop: any, collection: any[]){
        if(!prop.match("^(@_)(xmi|xmlns|xsi)")){
            const edge = new EMFEdge()
            edge.id = "("+prop.replace("@_","")+")"+dynamicParameters.nodeSet[dynamicParameters.parentIdx.idx].id+"->"+item
            edge.name = prop.replace("@_","")
            collection.push(edge)
        }
    }

    public srcCrossReferenceLoader(dynamicParameters: any, item: any, prop: any, collection: any[]){
        if(!prop.match("^(@_)(xmi|xmlns|xsi)")){
            const edgeSrc = [dynamicParameters.edgeSet[collection.length],dynamicParameters.nodeSet[dynamicParameters.parentIdx.idx]] as [EMFEdge,EMFObject]
            collection.push(edgeSrc)
        }
    }

    public trgCrossReferenceLoader(dynamicParameters: any, item: any, prop: any, collection: any[]){
        if(!prop.match("^(@_)(xmi|xmlns|xsi)")){
            const trgNodes = dynamicParameters.nodeSet.filter((node:EMFObject) => (node.id).replace(dynamicParameters.nodeSet[0].id+"/","//")===item)
            if(trgNodes.length !== 1){
                if(trgNodes.length < 1){
                    throw new Error("Nullreference exception:"+item)
                } else if(trgNodes.length > 1){
                    throw new Error("Reference not unique"+item)
                }
            }
            const edgeSrc = [dynamicParameters.edgeSet[collection.length],trgNodes[0]] as [EMFEdge,EMFObject]
            collection.push(edgeSrc)
        }
    }
    // tslint:disable-next-line:no-empty
    public noneStatic2DynamicState(dynamicState:any, staticState: any){}
}