const THREE = require('three/webgpu')
const { SkyMesh } = require('three/addons/objects/SkyMesh.js')
const {
    billboarding,
    cameraPosition,
    Fn,
    texture,
    uv,
    vec3,
    vec4,
    positionWorld,
    normalLocal,
    dot,
    color
} = require("three/tsl")


class ThemeManager {
    constructor() {
        this.main = window.mainInstance
        this.world = window.worldInstance
        this.scene = this.world.scene
        this.currentTheme = "Dark_Theme"

        this.createLightSky()
        this.createNightSky()

        this.ambientLight = new THREE.AmbientLight(0xffffff)
        this.scene.add(this.ambientLight)

        this.switchSky(this.currentTheme)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the light themed sky
     */
    createLightSky() {
        this.sky = new SkyMesh()
        this.sky.scale.setScalar(450000)

        const elevation = 13.6
        const azimuth = 135
        const phi = THREE.MathUtils.degToRad(90 - elevation)
        const theta = THREE.MathUtils.degToRad(azimuth)

        this.sky.turbidity.value = 0
        this.sky.rayleigh.value = 0.1
        this.sky.mieCoefficient.value = 0
        this.sky.mieDirectionalG.value = 0

        this.sky.cloudCoverage.value = 0.34
        this.sky.cloudDensity.value = 0.58
        this.sky.cloudElevation.value = 0.95

        this.sky.sunPosition.value = new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the stars for the dark themed sky
     */
    createStars() {
        this.starGeometry = new THREE.PlaneGeometry(1, 1)

        this.starMaterial = new THREE.MeshBasicNodeMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        })

        this.starMaterial.fragmentNode = Fn(() => {
            const tex = texture(this.main.resources.items['default'].starTexture.file, uv()).toConst()

            const color = vec3(1.0, 1.0, 1.0)

            return vec4(color, tex.r)
        })()

        this.starMaterial.vertexNode = billboarding({vertical: true})

        this.stars = new THREE.Group()
        const starCount = 750

        for (let i = 0; i < starCount; i++) {
            const phiMin = 0
            const phiMax = Math.PI * 2
            const thetaMin = Math.PI / 2
            const thetaMax = 3 * Math.PI / 2

            const spherical = new THREE.Spherical(
                80,
                Math.random() * (phiMax - phiMin)  + phiMin,
                Math.random() * (thetaMax - thetaMin) + thetaMin
            )

            const starMesh = new THREE.Mesh(this.starGeometry, this.starMaterial)

            starMesh.position.setFromSpherical(spherical)

            this.stars.add(starMesh)
        }

        this.nightSky.add(this.stars)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the moon for the dark themed sky
     */
    createMoon() {
        this.moon = new THREE.Group()

        this.moonMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshBasicNodeMaterial()
        )
        this.moonMesh.position.set(25, 14, -70)
        this.moon.add(this.moonMesh)
        this.moonMesh.material.fragmentNode = Fn(() => {
            return texture(this.main.resources.items['default'].moonTexture.file, uv()).mul(vec3(1.0, 1.0, 1.0))
        })()

        this.moonGlowMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 32, 32),
            new THREE.MeshStandardNodeMaterial({
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false
            })
        )
        this.moonGlowMesh.position.set(25, 14, -70)
        this.moon.add(this.moonGlowMesh)

        this.moonGlowMesh.material.fragmentNode = (() => {

            const viewDirection = positionWorld.sub(cameraPosition).normalize().toConst()

            const intensity = dot(viewDirection, normalLocal).pow(4.0)

            return color(vec3(1.0, 1.0, 1.0)).mul(intensity)
        })();

        this.nightSky.add(this.moon)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the dark themed sky
     */
    createNightSky() {
        this.nightSky = new THREE.Group()
        this.createStars()
        this.createMoon()
    }

    switchSky(newTheme) {
        if (newTheme === 'Dark_Theme') {
            this.scene.remove(this.sky)
            this.scene.add(this.nightSky)
            this.ambientLight.color.setHex(0xffffff)
        }
        else {
            this.scene.remove(this.nightSky)
            this.scene.add(this.sky)
            this.ambientLight.color.setHex(0xd6f8ff)
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Removes theme
     */
    reset() {
        this.scene.remove(this.nightSky)
        this.scene.remove(this.sky)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Cleans up the ThemeManager class
     */
    cleanup() {
        if (this.starMaterial) {
            this.starMaterial.dispose()
        }

        if (this.starGeometry) {
            this.starGeometry.dispose()
        }

        if (this.moonMesh) {
            this.moonMesh.material.dispose()
            this.moonMesh.geometry.dispose()
        }
        if (this.moonGlowMesh) {
            this.moonGlowMesh.material.dispose()
            this.moonGlowMesh.geometry.dispose()
        }
    }
}

module.exports = ThemeManager