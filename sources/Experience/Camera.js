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
    // this.setModes()
  }

  setInstance() {
    // Set up
    // this.instance = new THREE.PerspectiveCamera(
    //   45,
    //   this.config.width / this.config.height,
    //   0.1,
    //   150
    // )

    // this.scene.add(this.instance)

    this.instance = new THREE.PerspectiveCamera(
      45,
      this.config.width / this.config.height,
      0.1,
      100
    )
    this.instance.position.x = 0
    this.instance.position.y = 11.5
    this.instance.position.z = 12
    this.scene.add(this.instance)

    const axesHelper = new THREE.AxesHelper(50)
    this.scene.add(axesHelper)
  }

  setModes() {
    this.modes = {}

    // DefaultF
    this.modes.default = {}
    this.modes.default.instance = this.instance.clone()

    // Debug
    this.modes.debug = {}
    this.modes.debug.instance = this.instance.clone()
    this.modes.debug.instance.position.set(50, 35, 5)

    this.modes.debug.orbitControls = new OrbitControls(
      this.modes.debug.instance,
      this.targetElement
    )
    this.modes.debug.orbitControls.enabled = this.modes.debug.active
    this.modes.debug.orbitControls.screenSpacePanning = true
    this.modes.debug.orbitControls.enableKeys = false
    this.modes.debug.orbitControls.zoomSpeed = 0.25
    this.modes.debug.orbitControls.enableDamping = true
    this.modes.debug.orbitControls.update()
  }

  resize() {
    this.instance.aspect = this.config.width / this.config.height
    this.instance.updateProjectionMatrix()

    this.modes.default.instance.aspect = this.config.width / this.config.height
    this.modes.default.instance.updateProjectionMatrix()

    this.modes.debug.instance.aspect = this.config.width / this.config.height
    this.modes.debug.instance.updateProjectionMatrix()
  }

  update() {
    // // Update debug orbit controls
    // this.modes.debug.orbitControls.update()
    // // Apply coordinates
    // this.instance.position.copy(this.modes[this.mode].instance.position)
    // this.instance.quaternion.copy(this.modes[this.mode].instance.quaternion)
    // this.instance.updateMatrixWorld() // To be used in projection
  }

  destroy() {
    this.modes.debug.orbitControls.destroy()
  }
}
