import { EMFLoader } from './EMFLoader';
import fs from 'fs'
import path from 'path'
describe('EMFLoader unit tests', () => {
    test('load metamodel', () => {
        const location = path.join(__dirname, '..', '..' ,'test-models', 'example_ecore_catframe.ecore');
        const metaModel = fs.readFileSync(location)
        const emfLoader = new EMFLoader(metaModel.toString())
    })
    test('load model', () => {
        const location = path.join(__dirname, '..', '..', 'test-models', 'example_ecore_catframe.ecore');
        const metaModel = fs.readFileSync(location)
        const emfLoader = new EMFLoader(metaModel.toString())
        const location2 = path.join(__dirname, '..', '..', 'test-models', 'ExperimentalState1.xmi');
        const emfModel = fs.readFileSync(location2)
        const TypedGraph = emfLoader.loadEmfModel(emfModel.toString())
    })
})