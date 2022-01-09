export class EMFEdge{
    name:string
    id: string
    attributes:[string,string][]
    compare(a: EMFEdge):boolean{
        return a.id === this.id
    }
}