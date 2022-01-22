import { Graph, TGraph } from "catframe";
/**
 * @name EMF-Loader
 */
export declare class EMFLoader {
    typeGraph: Graph<object, object>;
    private traverser;
    options: {
        attributeNamePrefix: string;
        attrNodeName: string;
        textNodeName: string;
        ignoreAttributes: boolean;
        ignoreNameSpace: boolean;
        allowBooleanAttributes: boolean;
        parseNodeValue: boolean;
        parseAttributeValue: boolean;
        trimValues: boolean;
        cdataTagName: string;
        cdataPositionChar: string;
        parseTrueNumberOnly: boolean;
        numParseOptions: {
            hex: boolean;
            leadingZeros: boolean;
        };
        arrayMode: boolean;
        attrValueProcessor: (val: any, attrName: any) => void;
        tagValueProcessor: (val: any, tagName: any) => string;
        stopNodes: string[];
    };
    /**
     * This is the default constructor. It requires a emf metamodel as ecore xml string
     * @param metaModel a metamodel as ecore xml string
     */
    constructor(metaModel: string);
    /**
     * This is the method to load a metamodel from string and converts it to a Graph (Catframe)
     * @param metaModel ecore emf metamodel xml as string
     * @param options xml parsing options. See *fast-xml-parser* for reference
     * @returns a (type-) graph (Catframe) that represents the metamodel [not typed graph!!!]
     */
    private loadMetaModel;
    /**
     *
     *
     * @private
     * @param {Graph<object,object>} graph
     * @param {Graph<object,object>} typeGraph
     * @returns {(TGraph<object,object>|false)}
     * @memberof EMFLoader
     */
    private typeCheck;
    private recursiveTypeCheck;
    /**
     * The method to load an emf model with needs to be consistent to the metamodel given at the beginning
     * @param emfModel
     * @returns Typed Graph (Catframe) that represents the given model together with the metamodel
     */
    loadEmfModel(emfModel: string): TGraph<object, object>;
}
