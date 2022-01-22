"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmfTraverser = void 0;
const EMFEdge_1 = require("../DataClasses/EMFEdge");
const EMFObject_1 = require("../DataClasses/EMFObject");
class EmfTraverser {
    emfDfs(emfXMLModel, configuration, collection = [], xpath = "#/", returnOnAttribute = true, dynamicState = {}) {
        const props = Object.getOwnPropertyNames(emfXMLModel);
        const staticState = configuration.staticContextSetter(dynamicState);
        for (const prop of props) {
            if (prop.startsWith('@_')) {
                configuration.attributeSetter(staticState, emfXMLModel[prop], prop, collection);
            }
            else if (Array.isArray(emfXMLModel[prop])) {
                let childIdx = 0;
                for (const item of emfXMLModel[prop]) {
                    configuration.itemHandler(staticState, item, prop, childIdx, collection, xpath);
                    this.emfDfs(item, configuration, collection, xpath + "/@" + prop + "." + childIdx, returnOnAttribute, staticState);
                    configuration.staticToDynamicState(dynamicState, staticState);
                    childIdx = childIdx + 1;
                }
            }
            else {
                configuration.itemHandler(staticState, emfXMLModel[prop], prop, -1, collection, xpath);
                this.emfDfs(emfXMLModel[prop], configuration, collection, xpath + "/" + prop, returnOnAttribute, staticState);
                configuration.staticToDynamicState(dynamicState, staticState);
            }
        }
        return collection;
    }
    objectHandler(dynamicParameters, item, prop, childIdx, collection = [], xpath = "#/") {
        const obj = new EMFObject_1.EMFObject();
        if (item['@_xsi:type']) {
            obj.name = item['@_xsi:type'];
        }
        else {
            obj.name = prop;
        }
        if (childIdx === -1) {
            obj.id = xpath + "/" + prop;
        }
        else {
            obj.id = xpath + "/@" + prop + "." + childIdx;
        }
        collection.push(obj);
    }
    edgeHandler(dynamicParameters, item, prop, childIdx, collection = [], xpath = "#/") {
        if (dynamicParameters.currentIdx.idx === -1) {
            dynamicParameters.currentIdx.idx = 0;
        }
        else {
            const edge = new EMFEdge_1.EMFEdge();
            edge.id = "(" + prop.replace("@_", "") + ")" + dynamicParameters.nodeSet[dynamicParameters.parentIdx.idx].id + "->" + dynamicParameters.nodeSet[dynamicParameters.currentIdx.idx + 1].id;
            edge.name = prop.replace("@_", "");
            dynamicParameters.currentIdx.idx++;
            collection.push(edge);
        }
    }
    edgeSrcHandler(dynamicParameters, item, prop, childIdx, collection = [], xpath = "#/") {
        if (dynamicParameters.currentIdx.idx === -1) {
            dynamicParameters.currentIdx.idx = 0;
        }
        else {
            const edgeSrc = [dynamicParameters.edgeSet[collection.length], dynamicParameters.nodeSet[dynamicParameters.parentIdx.idx]];
            dynamicParameters.currentIdx.idx++;
            collection.push(edgeSrc);
        }
    }
    edgeTrgHandler(dynamicParameters, item, prop, childIdx, collection = [], xpath = "#/") {
        if (dynamicParameters.currentIdx.idx === -1) {
            dynamicParameters.currentIdx.idx = 0;
        }
        else {
            const edgeSrc = [dynamicParameters.edgeSet[collection.length], dynamicParameters.nodeSet[dynamicParameters.currentIdx.idx + 1]];
            dynamicParameters.currentIdx.idx++;
            collection.push(edgeSrc);
        }
    }
    noneContextInitializer(dynamicParameters, item, prop, childIdx, collection = [], xpath = "#/") {
        return {};
    }
    // tslint:disable-next-line:no-empty
    noneCrossReferenceLoader(dynamicParameters, item, prop, collection) { }
    defaultCrossReferenceLoader(dynamicParameters, item, prop, collection) {
        if (!prop.match("^(@_)(xmi|xmlns|xsi)")) {
            const edge = new EMFEdge_1.EMFEdge();
            edge.id = "(" + prop.replace("@_", "") + ")" + dynamicParameters.nodeSet[dynamicParameters.parentIdx.idx].id + "->" + item;
            edge.name = prop.replace("@_", "");
            collection.push(edge);
        }
    }
    srcCrossReferenceLoader(dynamicParameters, item, prop, collection) {
        if (!prop.match("^(@_)(xmi|xmlns|xsi)")) {
            const edgeSrc = [dynamicParameters.edgeSet[collection.length], dynamicParameters.nodeSet[dynamicParameters.parentIdx.idx]];
            collection.push(edgeSrc);
        }
    }
    trgCrossReferenceLoader(dynamicParameters, item, prop, collection) {
        if (!prop.match("^(@_)(xmi|xmlns|xsi)")) {
            const trgNodes = dynamicParameters.nodeSet.filter((node) => (node.id).replace(dynamicParameters.nodeSet[0].id + "/", "//") === item);
            if (trgNodes.length !== 1) {
                if (trgNodes.length < 1) {
                    throw new Error("Nullreference exception:" + item);
                }
                else if (trgNodes.length > 1) {
                    throw new Error("Reference not unique" + item);
                }
            }
            const edgeSrc = [dynamicParameters.edgeSet[collection.length], trgNodes[0]];
            collection.push(edgeSrc);
        }
    }
    // tslint:disable-next-line:no-empty
    noneStatic2DynamicState(dynamicState, staticState) { }
}
exports.EmfTraverser = EmfTraverser;
