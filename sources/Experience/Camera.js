import * as THREE from 'three'
import Experience from './Experience.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {
  constructor(_options) {
    // Options
    this.experience = new Experience()
    this.config = this.experience.config
    this.debug = this.experience.debug
    this.time = this.experience.time
    this.sizes = this.experience.sizes
    this.targetElement = this.experience.targetElement
    this.scene = this.experience.scene

    // Set up
    this.mode = 'debug' // defaultCamera \ debugCamera

    this.setInstance()

    // this.setOrbitControls()
  }

  setInstance() {
    // Set up
    this.instance = new THREE.PerspectiveCamera(
      70,
      this.config.width / this.config.height,
      0.1,
      150
    )

    // fov to 45
    this.instance.position.set(0, 15, 10.2)

    // this.instance.position.set(0, 17.8, 16.6)
    // this.instance.position.set(-15, 11, 5.2)

    // this.instance.rotation.reorder('YXZ')
    // this.instance.rotation.y = -Math.PI / 2

    this.instance.rotation.x = -Math.PI / 12
    // this.instance.rotation.z = Math.PI / 0.55
    this.scene.add(this.instance)
  }

  setOrbitControls() {
    this.orbitControls = new OrbitControls(this.instance, this.targetElement)
    this.orbitControls.enabled = true
    this.orbitControls.screenSpacePanning = true
    this.orbitControls.enableKeys = false
    this.orbitControls.zoomSpeed = 0.25
    this.orbitControls.enableDamping = true
    this.orbitControls.update()
  }

  setModes() {
    this.modes = {}

    // Default
    this.modes.default = {}
    this.modes.default.instance = this.instance.clone()
    this.modes.default.instance.rotation.reorder('YXZ')

    // Debug
    this.modes.debug = {}
    this.modes.debug.instance = this.instance.clone()
    this.modes.debug.instance.rotation.reorder('YXZ')
    this.modes.debug.instance.position.set(0, 17.8, 16.6)

    this.modes.debug.orbitControls = new OrbitControls(
      this.modes.debug.instance,
      this.targetElement
    )
    this.modes.debug.orbitControls.enabled = true
    this.modes.debug.orbitControls.screenSpacePanning = true
    this.modes.debug.orbitControls.enableKeys = false
    this.modes.debug.orbitControls.zoomSpeed = 0.25
    this.modes.debug.orbitControls.enableDamping = true
    this.modes.debug.orbitControls.update()
  }

  resize() {
    this.instance.aspect = this.config.width / this.config.height
    this.instance.updateProjectionMatrix()

    this.instance.aspect = this.config.width / this.config.height
    this.instance.updateProjectionMatrix()

    this.instance.aspect = this.config.width / this.config.height
    this.instance.updateProjectionMatrix()

    // this.modes.default.instance.aspect = this.config.width / this.config.height
    // this.modes.default.instance.updateProjectionMatrix()

    // this.modes.debug.instance.aspect = this.config.width / this.config.height
    // this.modes.debug.instance.updateProjectionMatrix()
  }

  update() {
    // Update debug orbit controls

    // this.orbitControls.update()

    this.instance.updateMatrixWorld() // To be used in projection
  }

  destroy() {
    this.modes.debug.orbitControls.destroy()
  }
}
