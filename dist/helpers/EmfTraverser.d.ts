import { EMFEdge } from "../DataClasses/EMFEdge";
import { EMFObject } from "../DataClasses/EMFObject";
export declare class EmfTraverser {
    emfDfs(emfXMLModel: any, configuration: any, collection?: EMFObject[], xpath?: string, returnOnAttribute?: boolean, dynamicState?: any): EMFObject[] | EMFEdge[] | [EMFEdge, EMFObject][];
    objectHandler(dynamicParameters: any, item: any, prop: any, childIdx: number, collection?: EMFObject[], xpath?: string): void;
    edgeHandler(dynamicParameters: any, item: any, prop: any, childIdx: number, collection?: EMFObject[], xpath?: string): void;
    edgeSrcHandler(dynamicParameters: any, item: any, prop: any, childIdx: number, collection?: [EMFEdge, EMFObject][], xpath?: string): void;
    edgeTrgHandler(dynamicParameters: any, item: any, prop: any, childIdx: number, collection?: [EMFEdge, EMFObject][], xpath?: string): void;
    noneContextInitializer(dynamicParameters: any, item: any, prop: any, childIdx: number, collection?: EMFObject[], xpath?: string): {};
    noneCrossReferenceLoader(dynamicParameters: any, item: any, prop: any, collection: any[]): void;
    defaultCrossReferenceLoader(dynamicParameters: any, item: any, prop: any, collection: any[]): void;
    srcCrossReferenceLoader(dynamicParameters: any, item: any, prop: any, collection: any[]): void;
    trgCrossReferenceLoader(dynamicParameters: any, item: any, prop: any, collection: any[]): void;
    noneStatic2DynamicState(dynamicState: any, staticState: any): void;
}
