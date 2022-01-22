export class EMFMetaEdge{
    name:string
    attributes:[string,string][]
    compare(a: EMFMetaEdge):boolean{
        return a.name === this.name
    }
}