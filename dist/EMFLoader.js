"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMFLoader = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
class EMFLoader {
    constructor(metaModel) {
        const parser = new fast_xml_parser_1.XMLParser();
        let metaModelXML = parser.parse(metaModel);
        expect(metaModelXML).toBeTruthy();
    }
}
exports.EMFLoader = EMFLoader;
