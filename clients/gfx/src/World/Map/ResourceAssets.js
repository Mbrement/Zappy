const THREE = require("three/webgpu")
const { mergeGeometries } = require("three/addons/utils/BufferGeometryUtils.js");

class ResourceAssets {
    constructor() {
        this.defaultSize = 0.05

        this.sphereGeometry = new THREE.SphereGeometry(this.defaultSize * 0.75, 16, 16)
        this.octahedronGeometry = new THREE.OctahedronGeometry(this.defaultSize)
        this.pyramidGeometry = new THREE.ConeGeometry(this.defaultSize, 0.07, 4)
        this.cylinderGeometry = new THREE.CylinderGeometry(this.defaultSize * 0.75, this.defaultSize * 0.75, 0.07, 10)
        this.dodecahedronGeometry = new THREE.DodecahedronGeometry(this.defaultSize * 0.75)

        this.assetGroups = {
                nourriture: {
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
            nourriture: {
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

        this.createResourceGroups()
    }

    createResourceGroups() {
        let geometries, geometry
        Object.entries(this.assetGroups).forEach(([name, meshes]) => {
            // Duo
            geometries = []
            geometry = this.resourceMeshInfo[name].geometry.clone()
            geometry.translate(-this.defaultSize * 1.15, 0 , 0)
            geometries.push(geometry)

            geometry = this.resourceMeshInfo[name].geometry.clone()
            geometry.translate(this.defaultSize * 1.15, 0 , 0)
            geometries.push(geometry)

            geometry = mergeGeometries(geometries)
            meshes.duo = new THREE.Mesh(geometry, this.resourceMeshInfo[name].material)

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

            geometry = mergeGeometries(geometries)
            meshes.trio = new THREE.Mesh(geometry, this.resourceMeshInfo[name].material)
        })
    }
}

module.exports = ResourceAssets