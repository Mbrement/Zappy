const {TextureLoader} = require('three/webgpu')
const {GLTFLoader} = require('three/addons')
const {KTX2Loader} = require('three/examples/jsm/loaders/KTX2Loader.js')
const EventEmitter = require('node:events')

class Resources extends EventEmitter {

    /**
     * @author Corentin (ccharton) Charton
     * @description Load all resources (textures, models, etc.) before starting the game
     * @param {Array} sources - Array of objects to load
     * @param {string} sourceListName - Name of the list to store the loaded resources
     * @param {string} emitEventName - Name of the event to emit when all resources are loaded
     */
    constructor(sources = null, sourceListName = 'default', emitEventName = 'loaded') {
        super()

        this.sources = sources
        this.items = {
            default: {}
        }
        this.toLoad = this.sources.length
        this.sourceListName = sourceListName
        this.emitEventName = emitEventName
        this.loaded = 0
        this.received = false
        this.isCleaningUp = false

        this.setLoaders().then( ()=> {
            if (this.sources) {
                this.startLoading()
            }
        })
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Set the loaders for textures, ktx2 textures and gltf models
     * @returns {Promise<void>}
     */
    async setLoaders() {
        this.loaders = {}
        this.loaders.textureLoader = new TextureLoader()

        this.loaders.ktx2Loader = new KTX2Loader()
        this.loaders.ktx2Loader.setTranscoderPath('/libs/basis/')

        this.loaders.gltfLoader = new GLTFLoader()
        this.loaders.gltfLoader.setKTX2Loader(this.loaders.ktx2Loader)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Load all resources
     * @param sources {Array} - Array of objects to load
     * @param sourceListName {string} - Name of the list to store the loaded resources
     * @param emitEventName {string} - Name of the event to emit when all resources are loaded
     * @returns {Promise<void>}
     */
    async startLoading(sources = null, sourceListName = 'default', emitEventName = 'loaded') {
        if (this.isCleaningUp) {
            return
        }

        if (sources) {
            this.sources = sources
            this.toLoad = this.sources.length
        }
        if (sourceListName) {
            this.sourceListName = sourceListName
            this.items[this.sourceListName] = {}
        }
        if (emitEventName) {
            this.emitEventName = emitEventName
        }


        for(const source of this.sources) {
            if (this.isCleaningUp) {
                break
            }
            switch (source.type) {
                case "texture":
                    await this.loaders.textureLoader.load(
                        source.path,
                        (file) => {
                            if (!this.isCleaningUp) {
                                this.sourceLoaded(source, file)
                            } else {
                                this.disposeItem(file)
                            }
                        },
                        undefined,
                        (error) => {
                            if (!this.isCleaningUp) {
                                console.error(`Error loading texture ${source.name}:`, error)
                            }
                        }
                    )
                    break
                case "ktx2Texture":
                    await this.loaders.ktx2Loader.load(
                        source.path,
                        (file) => {
                            if (!this.isCleaningUp) {
                                this.sourceLoaded(source, file)
                            } else {
                                this.disposeItem(file)
                            }
                        },
                        undefined,
                        (error) => {
                            if (!this.isCleaningUp) {
                                console.error(`Error loading KTX2 texture ${source.name}:`, error)
                            }
                        }
                    )
                    break
                case "gltfModel":
                    await this.loaders.gltfLoader.load(
                        source.path,
                        (file) => {
                            if (!this.isCleaningUp) {
                                this.sourceLoaded(source, file)
                            } else {
                                this.disposeItem(file)
                            }
                        },
                        undefined,
                        (error) => {
                            if (!this.isCleaningUp) {
                                console.error(`Error loading GLTF model ${source.name}:`, error)
                            }
                        }
                    )
                    break
            }
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description When a source is loaded, add it to the items object
     * @param source - source object
     * @param file - file loaded
     * @returns {Promise<void>}
     */
    async sourceLoaded(source, file) {
        if (this.isCleaningUp) {
            this.disposeItem(file)
            return
        }

        if (source.json) {
            try {
                source.json = await fetch(source.json).then((response) => response.json())
            } catch (error) {
                if (!this.isCleaningUp) {
                    console.error(`Error loading JSON for ${source.name}:`, error)
                }
                return
            }
        }
        this.items[this.sourceListName][source.name] = {
            file: file
        }
        this.loaded++

        if (this.loaded === this.toLoad) {
            this.received = false
            this.loaded = 0

            while (!this.received && !this.isCleaningUp) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        if (!this.received) {
                            this.emit(`${this.emitEventName}`)
                        }
                        resolve()
                    }, 350)
                })
            }
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Dispose a single loaded item (texture, material, geometry)
     * @param item {Object}- The item to dispose
     */
    disposeItem(item) {
        if (!item || !item.file) {
            return
        }

        const file = item.file

        if (file.scene) {
            file.scene.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose()
                }

                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            this.disposeMaterial(mat)
                        })
                    } else {
                        this.disposeMaterial(child.material)
                    }
                }
            })
        }

        if (file.isTexture) {
            file.dispose()
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Dispose a material and its textures
     * @param material - The material to dispose
     */
    disposeMaterial(material) {
        if (!material) {
            return
        }

        const textureProperties = [
            'map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap',
            'emissiveMap', 'envMap', 'lightMap', 'metalnessMap',
            'normalMap', 'roughnessMap', 'specularMap'
        ]

        textureProperties.forEach(prop => {
            if (material[prop] && material[prop].dispose) {
                material[prop].dispose()
            }
        })

        material.dispose()
    }


    /**
     * @author Corentin (ccharton) Charton
     * @description Clean up the resources
     */
    cleanup() {
        this.isCleaningUp = true
        this.received = true

        if (this.items) {
            for (const listName in this.items) {
                const itemList = this.items[listName]
                if (itemList && typeof itemList === 'object') {
                    for (const itemName in itemList) {
                        try {
                            this.disposeItem(itemList[itemName])
                        } catch (error) {
                        }
                    }
                }
            }
        }

        if (this.loaders) {
            if (this.loaders.ktx2Loader) {
                this.loaders.ktx2Loader.dispose()
            }
        }

        for (const properties in this) {
            this[properties] = null
        }
    }
}

module.exports = Resources