export class EMFObject{
    name:string
    id: string
    attributes:[string,string][]
    compare(a: EMFObject):boolean{
        return a.id === this.id
    }
    toString(){
        return this.name
    }
}