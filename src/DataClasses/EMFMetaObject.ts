export class EMFMetaObject{
    name:string
    attributes:[string,string][]
    compare(a: EMFMetaObject):boolean{
        return a.name === this.name
    }
}