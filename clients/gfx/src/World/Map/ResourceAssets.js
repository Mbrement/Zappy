const THREE = require("three/webgpu")
const { mergeGeometries } = require("three/addons/utils/BufferGeometryUtils.js");

class ResourceAssets {
    constructor() {
        this.world = window.worldInstance
        this.scene = this.world.scene

        this.defaultSize = 0.05

        this.positioningMatrix = new THREE.Matrix4()

        this.sphereGeometry = new THREE.SphereGeometry(this.defaultSize * 0.75, 6, 6)
        this.octahedronGeometry = new THREE.OctahedronGeometry(this.defaultSize)
        this.pyramidGeometry = new THREE.ConeGeometry(this.defaultSize, 0.07, 4)
        this.cylinderGeometry = new THREE.CylinderGeometry(this.defaultSize * 0.75, this.defaultSize * 0.75, 0.07, 10)
        this.dodecahedronGeometry = new THREE.DodecahedronGeometry(this.defaultSize * 0.75)

        this.assetGeometries = {
            food: {
                duo: null,
                trio: null,
            },
            linemate: {
                duo: null,
                trio: null,
            },
            deraumere: {
                duo: null,
                trio: null,
            },
            sibur: {
                duo: null,
                trio: null,
            },
            mendiane: {
                duo: null,
                trio: null,
            },
            phiras: {
                duo: null,
                trio: null,
            },
            thystame: {
                duo: null,
                trio: null,
            }
        }

        this.resourceMeshInfo = {
            food: {
                material: new THREE.MeshBasicNodeMaterial({color: 0x00ff00}),
                geometry: this.sphereGeometry
            },
            linemate: {
                material: new THREE.MeshBasicNodeMaterial({color: 0xedd51f}),
                geometry: this.pyramidGeometry
            },
            deraumere: {
                material: new THREE.MeshBasicNodeMaterial({color: 0xbd2100}),
                geometry: this.octahedronGeometry
            },
            sibur: {
                material: new THREE.MeshBasicNodeMaterial({color: 0x0040ff}),
                geometry: this.octahedronGeometry
            },
            mendiane: {
                material: new THREE.MeshBasicNodeMaterial({color: 0xe378c0}),
                geometry: this.pyramidGeometry
            },
            phiras: {
                material: new THREE.MeshBasicNodeMaterial({color: 0x24dce3}),
                geometry: this.cylinderGeometry
            },
            thystame: {
                material: new THREE.MeshBasicNodeMaterial({color: 0xa51fed}),
                geometry: this.dodecahedronGeometry
            }
        }

        this.resourceInstances = {
            food: {},
            linemate: {},
            deraumere: {},
            sibur: {},
            mendiane: {},
            phiras: {},
            thystame: {}
        }

        this.createResourceGeometries()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the resources geometries
     */
    createResourceGeometries() {
        let geometries, geometry
        Object.entries(this.assetGeometries).forEach(([name, meshes]) => {
            // Duo
            geometries = []
            geometry = this.resourceMeshInfo[name].geometry.clone()
            geometry.translate(-this.defaultSize * 1.15, 0 , 0)
            geometries.push(geometry)

            geometry = this.resourceMeshInfo[name].geometry.clone()
            geometry.translate(this.defaultSize * 1.15, 0 , 0)
            geometries.push(geometry)

            meshes.duo = mergeGeometries(geometries)

            // Trio
            geometries = []
            geometry = this.resourceMeshInfo[name].geometry.clone()
            geometry.translate(-this.defaultSize * 1.25, 0 , 0)
            geometries.push(geometry)

            geometry = this.resourceMeshInfo[name].geometry.clone()
            geometry.translate(this.defaultSize * 1.25, 0 , 0)
            geometries.push(geometry)

            geometry = this.resourceMeshInfo[name].geometry.clone()
            geometry.translate(0, 0 , this.defaultSize * 1.25)
            geometries.push(geometry)

            meshes.trio = mergeGeometries(geometries)
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates all the resources instances
     * @param mapSize - The size of the map
     */
    createResourceInstances(mapSize) {
        this.positioningMatrix.setPosition(9999, 9999, 9999)
        const quantity = mapSize[0] * mapSize[1]
        Object.entries(this.resourceInstances).forEach(([name, resource]) => {
            resource.singleQuantity = quantity
            resource.duoQuantity = quantity
            resource.trioQuantity = quantity

            resource.singleInstance = this.createInstance(name, this.resourceMeshInfo[name].geometry, quantity)
            resource.duoInstance = this.createInstance(name, this.assetGeometries[name].duo, quantity)
            resource.trioInstance = this.createInstance(name, this.assetGeometries[name].trio, quantity)

            this.scene.add(resource.singleInstance, resource.duoInstance, resource.trioInstance)
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Create an instance of a resource
     * @param name - The name of the resource
     * @param geometry - The geometry of the resource
     * @param quantity - The amount of instances to create
     * @returns {THREE.InstancedMesh} - The newly created instance
     */
    createInstance(name, geometry, quantity) {
        const instance = new THREE.InstancedMesh(geometry, this.resourceMeshInfo[name].material, quantity)
        instance.position.set(0, 0, 0)
        instance.frustumCulled = false
        instance.matrixAutoUpdate = false
        instance.matrixWorldAutoUpdate = false

        for (let i = 0; i < quantity; i++) {
            instance.setMatrixAt(i, this.positioningMatrix)
        }
        instance.instanceMatrix.needsUpdate = true
        return instance
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Clears the resource instances
     */
    clear() {
        Object.entries(this.resourceInstances).forEach(([_, resource]) => {
            this.scene.remove(resource.singleInstance, resource.duoInstance, resource.trioInstance)
        })
    }
}

module.exports = ResourceAssets