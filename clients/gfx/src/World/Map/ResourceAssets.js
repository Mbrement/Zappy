const THREE = require("three/webgpu")

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
                    duo: new THREE.Group(),
                    trio: new THREE.Group(),
                },
                linemate: {
                    duo: new THREE.Group(),
                    trio: new THREE.Group(),
                },
                deraumere: {
                    duo: new THREE.Group(),
                    trio: new THREE.Group(),
                },
                sibur: {
                    duo: new THREE.Group(),
                    trio: new THREE.Group(),
                },
                mendiane: {
                    duo: new THREE.Group(),
                    trio: new THREE.Group(),
                },
                phiras: {
                    duo: new THREE.Group(),
                    trio: new THREE.Group(),
                },
                thystame: {
                    duo: new THREE.Group(),
                    trio: new THREE.Group(),
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
        Object.entries(this.assetGroups).forEach(([name, groups]) => {
            let mesh
            mesh = new THREE.Mesh(this.resourceMeshInfo[name].geometry, this.resourceMeshInfo[name].material)
            mesh.position.set(-this.defaultSize * 1.3, 0 , 0)
            groups.duo.add(mesh)

            mesh = new THREE.Mesh(this.resourceMeshInfo[name].geometry, this.resourceMeshInfo[name].material)
            mesh.position.set(this.defaultSize * 1.3, 0 , 0)
            groups.duo.add(mesh)

            mesh = new THREE.Mesh(this.resourceMeshInfo[name].geometry, this.resourceMeshInfo[name].material)
            mesh.position.set(-this.defaultSize * 1.3, 0 , 0)
            groups.trio.add(mesh)

            mesh = new THREE.Mesh(this.resourceMeshInfo[name].geometry, this.resourceMeshInfo[name].material)
            mesh.position.set(this.defaultSize * 1.3, 0 , 0)
            groups.trio.add(mesh)

            mesh = new THREE.Mesh(this.resourceMeshInfo[name].geometry, this.resourceMeshInfo[name].material)
            mesh.position.set(0, 0 , this.defaultSize * 1.3)
            groups.trio.add(mesh)
        })
    }
}

module.exports = ResourceAssets