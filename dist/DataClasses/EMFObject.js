"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMFObject = void 0;
class EMFObject {
    compare(a) {
        return a.id === this.id;
    }
    toString() {
        return this.name;
    }
}
exports.EMFObject = EMFObject;
