export declare class EMFObject {
    name: string;
    id: string;
    attributes: [string, string][];
    compare(a: EMFObject): boolean;
    toString(): string;
}
