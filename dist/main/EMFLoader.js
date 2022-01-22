"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMFLoader = void 0;
const EmfTraverser_1 = require("./../helpers/EmfTraverser");
const catframe_1 = require("catframe");
const fast_xml_parser_1 = require("fast-xml-parser");
const he_1 = __importDefault(require("he"));
const EMFMetaEdge_1 = require("../DataClasses/EMFMetaEdge");
const EMFObject_1 = require("../DataClasses/EMFObject");
const StructureMap_1 = require("catframe/dist/Helpers/StructureMap");
/**
 * @name EMF-Loader
 */
class EMFLoader {
    /**
     * This is the default constructor. It requires a emf metamodel as ecore xml string
     * @param metaModel a metamodel as ecore xml string
     */
    constructor(metaModel) {
        this.options = { attributeNamePrefix: "@_", attrNodeName: "attr", textNodeName: "#text", ignoreAttributes: false, ignoreNameSpace: false, allowBooleanAttributes: false,
            parseNodeValue: true, parseAttributeValue: true, trimValues: true, cdataTagName: "__cdata", cdataPositionChar: "\\c",
            parseTrueNumberOnly: false, numParseOptions: { hex: true, leadingZeros: true }, arrayMode: false, attrValueProcessor: (val, attrName) => { he_1.default.decode(val, { isAttributeValue: true }); },
            tagValueProcessor: (val, tagName) => he_1.default.decode(val), stopNodes: ["parse-me-as-string"] };
        this.typeGraph = this.loadMetaModel(metaModel, this.options);
        this.traverser = new EmfTraverser_1.EmfTraverser();
    }
    /**
     * This is the method to load a metamodel from string and converts it to a Graph (Catframe)
     * @param metaModel ecore emf metamodel xml as string
     * @param options xml parsing options. See *fast-xml-parser* for reference
     * @returns a (type-) graph (Catframe) that represents the metamodel [not typed graph!!!]
     */
    loadMetaModel(metaModel, options) {
        const parser = new fast_xml_parser_1.XMLParser(options);
        const metaModelXML = parser.parse(metaModel);
        const typeGraph = new catframe_1.Graph();
        const nodeMap = new Map();
        // very simplified TODO
        const nodePathMap = (EPath) => Array.from(typeGraph.nodeSet).filter((val) => val.name === EPath.replace("#//", ""))[0];
        const edgeMap = new Map();
        typeGraph.nodeSet = new catframe_1.CatSet((o, p) => o.compare(p), ...metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object) => {
            const CatSetNode = new EMFObject_1.EMFObject();
            CatSetNode.name = object["@_name"];
            nodeMap.set(object, CatSetNode);
            return CatSetNode;
        }));
        typeGraph.edgeSet = new catframe_1.CatSet((o, p) => o.compare(p), ...metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object, i) => {
            if (object.eStructuralFeatures) {
                if (Array.isArray(object.eStructuralFeatures)) {
                    return object.eStructuralFeatures.filter((ef) => ef['@_xsi:type'] === 'ecore:EReference').map((o) => {
                        const CatSetEdge = new EMFMetaEdge_1.EMFMetaEdge();
                        CatSetEdge.name = o["@_name"];
                        edgeMap.set(o, CatSetEdge);
                        return CatSetEdge;
                    });
                }
                else {
                    return [
                        // transformer (function)
                        ((o) => {
                            const CatSetEdge = new EMFMetaEdge_1.EMFMetaEdge();
                            CatSetEdge.name = o["@_name"];
                            edgeMap.set(o, CatSetEdge);
                            return CatSetEdge;
                        })(object.eStructuralFeatures)
                    ];
                }
            }
            else {
                return [];
            }
        }).reduce((combine, current) => combine.concat(current), []));
        typeGraph.src = new Map(metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object, i) => {
            if (object.eStructuralFeatures) {
                if (Array.isArray(object.eStructuralFeatures)) {
                    return object.eStructuralFeatures.filter((ef) => ef['@_xsi:type'] === 'ecore:EReference').map((o, j) => { return [edgeMap.get(o), nodeMap.get(object)]; });
                }
                else {
                    return [
                        // transformer (function)
                        ((o) => { return [edgeMap.get(o), nodeMap.get(object)]; })(object.eStructuralFeatures)
                    ];
                }
            }
            else {
                return [];
            }
        }).reduce((combine, current) => combine.concat(current), []));
        typeGraph.trg = new Map(metaModelXML['ecore:EPackage'].eClassifiers.filter((eClassifier) => eClassifier['@_xsi:type'] === 'ecore:EClass').map((object, i) => {
            if (object.eStructuralFeatures) {
                if (Array.isArray(object.eStructuralFeatures)) {
                    return object.eStructuralFeatures.filter((ef) => ef['@_xsi:type'] === 'ecore:EReference').map((o, j) => { return [edgeMap.get(o), nodePathMap(o['@_eType'])]; });
                }
                else {
                    return [
                        // transformer (function)
                        ((o) => { return [edgeMap.get(o), nodePathMap(o['@_eType'])]; })(object.eStructuralFeatures)
                    ];
                }
            }
            else {
                return [];
            }
        }).reduce((combine, current) => combine.concat(current), []));
        return typeGraph;
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
    typeCheck(graph, typeGraph) {
        const nodeMapTuples = [];
        const edgeMapTuples = [];
        const root = graph.nodeSet[0];
        this.recursiveTypeCheck(root, graph, typeGraph, nodeMapTuples, edgeMapTuples);
        const nodeMap = new StructureMap_1.StructureMap(nodeMapTuples);
        const edgeMap = new StructureMap_1.StructureMap(edgeMapTuples);
        return new catframe_1.TGraph(new catframe_1.GraphMorphism(graph, typeGraph, nodeMap, edgeMap));
    }
    recursiveTypeCheck(node, graph, typeGraph, nodeMapTuples, edgeMapTuples, typeHint = null) {
        if (nodeMapTuples.filter((tuple) => tuple[0] === node).length > 0) {
            return;
        }
        // TODO make less restrictive regarding edgeInstanceName (currently node Name in lowercase therefore we are able to reconstruct typing easyly but error-prone)
        let nodeName = node.name[0].toUpperCase() + node.name.substring(1);
        if (nodeName.includes(":")) {
            nodeName = nodeName.split(":")[1];
        }
        for (const typenode of typeGraph.nodeSet) {
            if (typenode.name === nodeName) {
                nodeMapTuples.push([node, typenode]);
                break;
            }
        }
        const edges = [];
        for (const entry of graph.src.entries()) {
            if (entry[1] === node) {
                edges.push(entry[0]);
            }
        }
        for (const edge of edges) {
            for (const typeEdge of typeGraph.edgeSet) {
                if (typeEdge.name === edge.name) {
                    edgeMapTuples.push([edge, typeEdge]);
                    break;
                }
            }
            // TODO useTypeHint
            this.recursiveTypeCheck(graph.trg.get(edge), graph, typeGraph, nodeMapTuples, edgeMapTuples);
        }
    }
    /**
     * The method to load an emf model with needs to be consistent to the metamodel given at the beginning
     * @param emfModel
     * @returns Typed Graph (Catframe) that represents the given model together with the metamodel
     */
    loadEmfModel(emfModel) {
        const parser = new fast_xml_parser_1.XMLParser(this.options);
        const modelXML = parser.parse(emfModel);
        delete modelXML['?xml'];
        const EMFGraph = new catframe_1.Graph();
        let configuration = {
            staticContextSetter: this.traverser.noneContextInitializer,
            itemHandler: this.traverser.objectHandler,
            attributeSetter: this.traverser.noneCrossReferenceLoader,
            staticToDynamicState: this.traverser.noneStatic2DynamicState
        };
        EMFGraph.nodeSet = new catframe_1.CatSet((a, b) => a.compare(b), ...this.traverser.emfDfs(modelXML, configuration));
        configuration =
            {
                staticContextSetter: (dynamicState) => { return { parentIdx: { idx: dynamicState.currentIdx.idx }, currentIdx: { idx: dynamicState.currentIdx.idx }, nodeSet: EMFGraph.nodeSet }; },
                itemHandler: this.traverser.edgeHandler,
                attributeSetter: this.traverser.defaultCrossReferenceLoader,
                staticToDynamicState: (dynamicState, staticState) => { dynamicState.currentIdx = staticState.currentIdx; }
            };
        EMFGraph.edgeSet = new catframe_1.CatSet((a, b) => a.compare(b), ...this.traverser.emfDfs(modelXML, configuration, [], "#/", false, { currentIdx: { idx: -1 } }));
        configuration =
            {
                staticContextSetter: (dynamicState) => { return { parentIdx: { idx: dynamicState.currentIdx.idx }, currentIdx: { idx: dynamicState.currentIdx.idx }, nodeSet: EMFGraph.nodeSet, edgeSet: EMFGraph.edgeSet }; },
                itemHandler: this.traverser.edgeSrcHandler,
                attributeSetter: this.traverser.srcCrossReferenceLoader,
                staticToDynamicState: (dynamicState, staticState) => { dynamicState.currentIdx = staticState.currentIdx; }
            };
        EMFGraph.src = new StructureMap_1.StructureMap(this.traverser.emfDfs(modelXML, configuration, [], "#/", false, { currentIdx: { idx: -1 }, currentEdgeIdx: { idx: 0 } }));
        configuration =
            {
                staticContextSetter: (dynamicState) => { return { parentIdx: { idx: dynamicState.currentIdx.idx }, currentIdx: { idx: dynamicState.currentIdx.idx }, nodeSet: EMFGraph.nodeSet, edgeSet: EMFGraph.edgeSet }; },
                itemHandler: this.traverser.edgeTrgHandler,
                attributeSetter: this.traverser.trgCrossReferenceLoader,
                staticToDynamicState: (dynamicState, staticState) => { dynamicState.currentIdx = staticState.currentIdx; }
            };
        EMFGraph.trg = new StructureMap_1.StructureMap(this.traverser.emfDfs(modelXML, configuration, [], "#/", false, { currentIdx: { idx: -1 }, currentEdgeIdx: { idx: 0 } }));
        // tslint:disable-next-line:no-console
        console.log("TypeGraph");
        // tslint:disable-next-line:no-console
        console.log(this.typeGraph);
        // tslint:disable-next-line:no-console
        console.log("Graph");
        // tslint:disable-next-line:no-console
        console.log(EMFGraph);
        const tgraph = this.typeCheck(EMFGraph, this.typeGraph);
        if (tgraph) {
            return tgraph;
        }
        else {
            throw new Error("Graph is not well typed");
        }
    }
}
exports.EMFLoader = EMFLoader;
