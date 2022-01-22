import { EmfTraverser } from './../helpers/EmfTraverser';
import { CatSet, Graph, GraphMorphism, TGraph } from "catframe";
import { XMLParser } from "fast-xml-parser";
import he from "he";
import { EMFEdge } from "../DataClasses/EMFEdge";
import { EMFMetaEdge } from "../DataClasses/EMFMetaEdge";
import { EMFMetaObject } from "../DataClasses/EMFMetaObject";
import { EMFObject } from "../DataClasses/EMFObject";
import { StructureMap } from 'catframe/dist/Helpers/StructureMap';

/**
 * @name EMF-Loader
 */
export class EMFLoader{
    public typeGraph: Graph<object,object>;
    private traverser: EmfTraverser
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
        this.traverser = new EmfTraverser()
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
        const nodePathMap = (EPath:string) => Array.from(typeGraph.nodeSet).filter((val: any) => val.name === EPath.replace("#//",""))[0]
        const edgeMap = new Map()
        typeGraph.nodeSet = new CatSet((o:EMFMetaObject, p: EMFMetaObject) => o.compare(p),...metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier:any) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object:any) => {
            const CatSetNode = new EMFObject()
            CatSetNode.name=object["@_name"];
            nodeMap.set(object,CatSetNode)
            return CatSetNode
        }))
        typeGraph.edgeSet = new CatSet((o:EMFMetaEdge, p: EMFMetaEdge) => o.compare(p),...metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier:any) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object:any, i:number) => {
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
     *
     *
     * @private
     * @param {Graph<object,object>} graph
     * @param {Graph<object,object>} typeGraph
     * @returns {(TGraph<object,object>|false)}
     * @memberof EMFLoader
     */
    private typeCheck(graph:Graph<object,object>, typeGraph:Graph<object,object>): TGraph<object,object>|false {
        const nodeMapTuples:[object,object][] = []
        const edgeMapTuples:[object,object][] = []
        const root = graph.nodeSet[0]
        this.recursiveTypeCheck(root as EMFObject, graph as Graph<EMFObject,EMFEdge>, typeGraph as Graph<EMFMetaObject,EMFMetaEdge>, nodeMapTuples as [EMFObject,EMFMetaObject][], edgeMapTuples as [EMFEdge,EMFMetaEdge][])
        const nodeMap = new StructureMap<object>(nodeMapTuples)
        const edgeMap = new StructureMap<object>(edgeMapTuples)
        return new TGraph(new GraphMorphism<object,object>(graph,typeGraph,nodeMap,edgeMap))
    }
    private recursiveTypeCheck(node:EMFObject, graph:Graph<EMFObject,EMFEdge>, typeGraph:Graph<EMFMetaObject,EMFMetaEdge>, nodeMapTuples:[EMFObject,EMFMetaObject][], edgeMapTuples: [EMFEdge,EMFMetaEdge][], typeHint:EMFObject = null){
        if(nodeMapTuples.filter((tuple) => tuple[0] === node).length > 0){
            return
        }
        // TODO make less restrictive regarding edgeInstanceName (currently node Name in lowercase therefore we are able to reconstruct typing easyly but error-prone)
        let nodeName = node.name[0].toUpperCase()+node.name.substring(1)
        if(nodeName.includes(":")){
            nodeName = nodeName.split(":")[1]
        }
        for(const typenode of typeGraph.nodeSet){
            if(typenode.name === nodeName){
                nodeMapTuples.push([node,typenode])
                break;
            }
        }
        const edges = []
        for(const entry of graph.src.entries()){
            if(entry[1] === node){
                edges.push(entry[0])
            }
        }
        for(const edge of edges){
            for(const typeEdge of typeGraph.edgeSet){
                if(typeEdge.name === edge.name){
                    edgeMapTuples.push([edge,typeEdge])
                    break;
                }
            }
            // TODO useTypeHint
            this.recursiveTypeCheck(graph.trg.get(edge), graph, typeGraph, nodeMapTuples, edgeMapTuples)
        }
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
        let configuration =
        {
            staticContextSetter:this.traverser.noneContextInitializer,
            itemHandler: this.traverser.objectHandler as (dynamicParameters: any, item:any, prop:any, childIdx:number, collection:EMFObject[]|EMFEdge[]|[EMFEdge,EMFObject][], xpath: string) => void,
            attributeSetter: this.traverser.noneCrossReferenceLoader,
            staticToDynamicState: this.traverser.noneStatic2DynamicState
        }
        EMFGraph.nodeSet = new CatSet((a:EMFObject, b:EMFObject)=> a.compare(b), ...this.traverser.emfDfs(modelXML, configuration) as EMFObject[])

        configuration =
        {
            staticContextSetter: (dynamicState:any) => { return {parentIdx:{idx:dynamicState.currentIdx.idx}, currentIdx: {idx:dynamicState.currentIdx.idx}, nodeSet: EMFGraph.nodeSet}},
            itemHandler:this.traverser.edgeHandler,
            attributeSetter: this.traverser.defaultCrossReferenceLoader,
            staticToDynamicState: (dynamicState, staticState) => {dynamicState.currentIdx = staticState.currentIdx}
        }
        EMFGraph.edgeSet = new CatSet((a:EMFEdge, b:EMFEdge)=> a.compare(b), ...this.traverser.emfDfs(modelXML,configuration,[], "#/", false, {currentIdx:{idx:-1}}) as EMFEdge[])

        configuration =
        {
            staticContextSetter: (dynamicState:any) => { return {parentIdx:{idx:dynamicState.currentIdx.idx}, currentIdx: {idx:dynamicState.currentIdx.idx}, nodeSet: EMFGraph.nodeSet, edgeSet: EMFGraph.edgeSet}},
            itemHandler:this.traverser.edgeSrcHandler,
            attributeSetter: this.traverser.srcCrossReferenceLoader,
            staticToDynamicState: (dynamicState, staticState) => {dynamicState.currentIdx = staticState.currentIdx}
        }
        EMFGraph.src = new StructureMap(this.traverser.emfDfs(modelXML,configuration,[], "#/", false, {currentIdx:{idx:-1},currentEdgeIdx:{idx:0}}) as [EMFEdge,EMFObject][])

        configuration =
        {
            staticContextSetter: (dynamicState:any) => { return {parentIdx:{idx:dynamicState.currentIdx.idx}, currentIdx: {idx:dynamicState.currentIdx.idx}, nodeSet: EMFGraph.nodeSet, edgeSet: EMFGraph.edgeSet}},
            itemHandler:this.traverser.edgeTrgHandler,
            attributeSetter: this.traverser.trgCrossReferenceLoader,
            staticToDynamicState: (dynamicState, staticState) => {dynamicState.currentIdx = staticState.currentIdx}
        }
        EMFGraph.trg = new StructureMap(this.traverser.emfDfs(modelXML,configuration,[], "#/", false, {currentIdx:{idx:-1},currentEdgeIdx:{idx:0}}) as [EMFEdge,EMFObject][])

        // tslint:disable-next-line:no-console
        console.log("TypeGraph")
        // tslint:disable-next-line:no-console
        console.log(this.typeGraph)
        // tslint:disable-next-line:no-console
        console.log("Graph")
        // tslint:disable-next-line:no-console
        console.log(EMFGraph)
        const tgraph = this.typeCheck(EMFGraph,this.typeGraph)
        if(tgraph){
            return tgraph
        }
        else{
            throw new Error("Graph is not well typed")
        }
    }
}