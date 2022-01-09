import { EMFEdge } from './EMFEdge';
import { EMFMetaObject } from './EMFMetaObject';
import { EMFObject } from './EMFObject';
import { CatSet, Graph, TGraph } from "catframe";
import { XMLParser } from "fast-xml-parser";
import * as he from 'he'
import { EMFMetaEdge } from './EMFMetaEdge';
import { run } from 'tslint/lib/runner';
import { isPropertySignature } from 'typescript';
/**
 * @name EMF-Loader
 */
export class EMFLoader{
    public typeGraph: Graph<object,object>;
    public options = {attributeNamePrefix : "@_",attrNodeName: "attr",textNodeName : "#text",ignoreAttributes : false,ignoreNameSpace : false,allowBooleanAttributes : false,
        parseNodeValue : true,parseAttributeValue : true,trimValues: true,cdataTagName: "__cdata",cdataPositionChar: "\\c",
        parseTrueNumberOnly: false,numParseOptions:{hex: true,leadingZeros: true},arrayMode: false,attrValueProcessor: (val:any, attrName:any) => {he.decode(val, {isAttributeValue: true})},
        tagValueProcessor : (val:any, tagName:any) => he.decode(val),stopNodes: ["parse-me-as-string"]
    };
    /**
     * This is the default constructor. It requires a emf metamodel as ecore xml string
     * @param metaModel a metamodel as ecore xml string
     */
    constructor(metaModel: string){
        this.typeGraph = this.loadMetaModel(metaModel, this.options)
    }
    /**
     * This is the method to load a metamodel from string and converts it to a Graph (Catframe)
     * @param metaModel ecore emf metamodel xml as string
     * @param options xml parsing options. See *fast-xml-parser* for reference
     * @returns a (type-) graph (Catframe) that represents the metamodel [not typed graph!!!]
     */
    private loadMetaModel(metaModel: string, options:any){
        const parser = new XMLParser(options);
        const metaModelXML = parser.parse(metaModel);
        const typeGraph = new Graph<object,object>()
        const nodeMap = new Map()
        // very simplified TODO
        const nodePathMap = (EPath:string) => typeGraph.nodeSet.filter((val: any) => val.name === EPath.replace("#//",""))[0]
        const edgeMap = new Map()
        typeGraph.nodeSet = new CatSet((o:EMFMetaObject, p: EMFMetaObject) => o.compare(p),metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier:any) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object:any) => {
            const CatSetNode = new EMFObject()
            CatSetNode.name=object["@_name"];
            nodeMap.set(object,CatSetNode)
            return CatSetNode
        }))
        typeGraph.edgeSet = new CatSet((o:EMFMetaEdge, p: EMFMetaEdge) => o.compare(p),metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier:any) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object:any, i:number) => {
            if(object.eStructuralFeatures){
                if(Array.isArray(object.eStructuralFeatures)){
                    return object.eStructuralFeatures.filter((ef:any) => ef['@_xsi:type'] === 'ecore:EReference').map((o:any) => {
                        const CatSetEdge = new EMFMetaEdge()
                        CatSetEdge.name = o["@_name"]
                        edgeMap.set(o,CatSetEdge)
                        return CatSetEdge
                    })
                }
                else {
                    return [
                        // transformer (function)
                        ((o:any) => {
                            const CatSetEdge = new EMFMetaEdge()
                            CatSetEdge.name = o["@_name"]
                            edgeMap.set(o,CatSetEdge)
                            return CatSetEdge}
                        )
                        // apply to
                        (object.eStructuralFeatures)
                    ]
                }
            }
            else {
                return []
            }

        }).reduce((combine:any[],current:any[]) => combine.concat(current),[]))

        typeGraph.src = new Map(metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier:any) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object:any, i:number) => {
            if(object.eStructuralFeatures){
                if(Array.isArray(object.eStructuralFeatures)){
                    return object.eStructuralFeatures.filter((ef:any) => ef['@_xsi:type'] === 'ecore:EReference').map((o:any, j:number) => {return [edgeMap.get(o),nodeMap.get(object)]})
                }
                else {
                    return [
                        // transformer (function)
                        ((o:any) => {return [edgeMap.get(o),nodeMap.get(object)]})
                        // apply to
                        (object.eStructuralFeatures)
                    ]
                }
            }
            else {
                return []
            }

        }).reduce((combine:any[],current:any[]) => combine.concat(current),[]))

        typeGraph.trg = new Map(metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier:any) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object:any, i:number) => {
            if(object.eStructuralFeatures){
                if(Array.isArray(object.eStructuralFeatures)){
                    return object.eStructuralFeatures.filter((ef:any) => ef['@_xsi:type'] === 'ecore:EReference').map((o:any, j:number) => {return [edgeMap.get(o),nodePathMap(o['@_eType'])]})
                }
                else {
                    return [
                        // transformer (function)
                        ((o:any) => {return [edgeMap.get(o),nodePathMap(o['@_eType'])]})
                        // apply to
                        (object.eStructuralFeatures)
                    ]
                }
            }
            else {
                return []
            }

        }).reduce((combine:any[],current:any[]) => combine.concat(current),[]))
        return typeGraph
    }
    /**
     * The method to load an emf model with needs to be consistent to the metamodel given at the beginning
     * @param emfModel
     * @returns Typed Graph (Catframe) that represents the given model together with the metamodel
     */
    public loadEmfModel(emfModel: string):TGraph<object,object>{
        const parser = new XMLParser(this.options);
        const modelXML = parser.parse(emfModel);
        delete modelXML['?xml']
        const EMFGraph = new Graph<EMFObject,EMFEdge>()
        const nodeMap = new Map()
        // very simplified TODO
        const nodePathMap = (EPath:string) => EMFGraph.nodeSet.filter((val: any) => val.name === EPath.replace("#//",""))[0]
        const edgeMap = new Map()
        let configuration:any = {itemHandler:null}
        // tslint:disable-next-line:only-arrow-functions
        configuration.itemHandler = function(dynamicParameters: any, item:any, prop:any, childIdx:number, collection:EMFObject[] = [], xpath = "#/"){
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
                obj.id = xpath+"/"+prop+"."+childIdx
            }
            collection.push(obj)
        }
        // tslint:disable-next-line:no-empty
        configuration.globalLoopSetter = () => {return {}}
        // tslint:disable-next-line:no-empty
        configuration.attributeSetter = (item: any, prop: any, collection: any[]) => {}
        EMFGraph.nodeSet = new CatSet((a:EMFObject, b:EMFObject)=> a.compare(b), ...this.emfDfs(modelXML, configuration))

        configuration = {}
        configuration.nodeSet =  EMFGraph.nodeSet
        // tslint:disable-next-line:only-arrow-functions
        configuration.itemHandler = function(dynamicParameters: any,item:any, prop:any, childIdx:number, collection:EMFObject[] = [], xpath = "#/"){
            if(dynamicParameters.currentIdx.idx === -1){
                dynamicParameters.currentIdx.idx = 0
            }
            else{
                const edge = new EMFEdge()
                edge.id = "("+prop.replace("@_","")+")"+this.nodeSet[dynamicParameters.parentIdx.idx].id+"->"+this.nodeSet[dynamicParameters.currentIdx.idx + 1].id
                edge.name = prop.replace("@_","")
                dynamicParameters.currentIdx.idx ++;
                collection.push(edge)
            }
        }
        // tslint:disable-next-line:only-arrow-functions
        configuration.globalLoopSetter = function(dynamicState:any){
            return {parentIdx:{idx:dynamicState.currentIdx.idx}, currentIdx: {idx:dynamicState.currentIdx.idx}}
        }
        // tslint:disable-next-line:only-arrow-functions
        configuration.attributeSetter = function(dynamicParameters: any, item: any, prop: any, collection: any[]){
            if(!prop.match("^(@_)(xmi|xmlns|xsi)")){
                const edge = new EMFEdge()
                edge.id = "("+prop.replace("@_","")+")"+this.nodeSet[dynamicParameters.parentIdx.idx].id+"->"+item
                edge.name = prop.replace("@_","")
                collection.push(edge)
            }
        }
        EMFGraph.edgeSet = new CatSet((a:EMFEdge, b:EMFEdge)=> a.compare(b), ...this.emfDfs(modelXML,configuration,[], "#/", false, {currentIdx:{idx:-1}}))
        // tslint:disable-next-line:no-console
        console.log(EMFGraph)
        return null
    }

    private emfDfs(emfXMLModel:any,configuration: any, collection:EMFObject[] = [], xpath = "#/", returnOnAttribute=true, dynamicState:any = {}):EMFObject[]{
        const props = Object.getOwnPropertyNames(emfXMLModel)
        dynamicState = configuration.globalLoopSetter(dynamicState)
        for(const prop of props){
            if(prop.startsWith('@_')){
                if(returnOnAttribute){
                    return collection
                }
                else {
                    configuration.attributeSetter(dynamicState,emfXMLModel[prop], prop, collection)
                }
            }
            else if(Array.isArray(emfXMLModel[prop])){
                let childIdx = 0
                for(const item of emfXMLModel[prop]){
                    configuration.itemHandler(dynamicState, item, prop, childIdx, collection, xpath)
                    this.emfDfs(item, configuration, collection,xpath+"/"+prop+"."+childIdx, returnOnAttribute, dynamicState)
                    childIdx = childIdx + 1;
                }
            } else {
                configuration.itemHandler(dynamicState, emfXMLModel[prop], prop, -1 , collection, xpath)
                this.emfDfs(emfXMLModel[prop], configuration, collection, xpath+"/"+prop, returnOnAttribute, dynamicState)
            }
        }
        return collection
    }

    private emfEdgeDfs(emfXMLModel:any, nodeSet: CatSet<EMFEdge>, collection:EMFObject[] = [], currentIdx = {idx:-1}):EMFObject[]{
        const parentIdx = {idx:currentIdx.idx}
        const props = Object.getOwnPropertyNames(emfXMLModel)
        // tslint:disable-next-line:no-console
        console.log(props)
        for(const prop of props){
            if(prop.startsWith('@_')){
                if(!prop.match("^(@_)(xmi|xmlns|xsi)")){
                    const edge = new EMFEdge()
                    edge.id = "("+prop.replace("@_","")+")"+nodeSet[parentIdx.idx].id+"->"+emfXMLModel[prop]
                    edge.name = prop.replace("@_","")
                    collection.push(edge)
                }
            }
            else if(Array.isArray(emfXMLModel[prop])){
                for(const item of emfXMLModel[prop]){
                    if(currentIdx.idx === -1){
                        currentIdx.idx = 0
                    }
                    else{
                        const edge = new EMFEdge()
                        edge.id = "("+prop.replace("@_","")+")"+nodeSet[parentIdx.idx].id+"->"+nodeSet[currentIdx.idx + 1].id
                        edge.name = prop.replace("@_","")
                        currentIdx.idx ++;
                        collection.push(edge)
                    }
                    this.emfEdgeDfs(item, nodeSet, collection, currentIdx)
                }
            } else {
                if(currentIdx.idx === -1){
                    currentIdx.idx = 0
                }
                else{
                    const edge = new EMFEdge()
                    edge.id = "("+prop.replace("@_","")+")"+nodeSet[parentIdx.idx].id+"->"+nodeSet[currentIdx.idx + 1].id
                    edge.name = prop.replace("@_","")
                    currentIdx.idx ++;
                    collection.push(edge)
                }
                this.emfEdgeDfs(emfXMLModel[prop], nodeSet, collection, currentIdx)
            }
        }
        return collection
    }
}