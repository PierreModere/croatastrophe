import * as THREE from 'three'
import GUI from 'lil-gui'

import Time from './Utils/Time.js'
import Sizes from './Utils/Sizes.js'
import Stats from './Utils/Stats.js'

import Resources from './Resources.js'
import Renderer from './Renderer.js'
import Camera from './Camera.js'
import World from './World.js'

import assets from './assets.js'

import Axis from 'axis-api'

// import Axis from './axis/index'

export default class Experience {
  static instance

  constructor(_options = {}) {
    if (Experience.instance) {
      return Experience.instance
    }
    Experience.instance = this

    // Options
    this.targetElement = _options.targetElement

    if (!this.targetElement) {
      console.warn("Missing 'targetElement' property")
      return
    }

    this.time = new Time()
    this.sizes = new Sizes()

    this.setConfig()
    this.setDebug()
    this.setStats()
    this.setScene()
    this.setCamera()
    this.setRenderer()
    this.setResources()
    this.setWorld()
    this.setControls()

    this.sizes.on('resize', () => {
      this.resize()
    })

    this.update()
  }

  setConfig() {
    this.config = {}

    // Debug
    this.config.debug = window.location.hash === '#debug'

    // Pixel ratio
    this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

    // Width and height
    const boundings = this.targetElement.getBoundingClientRect()
    this.config.width = boundings.width
    this.config.height = boundings.height || window.innerHeight
  }

  setDebug() {
    if (this.config.debug) {
      this.debug = new GUI()
    }
  }

  setStats() {
    if (this.config.debug) {
      this.stats = new Stats(true)
    }
  }

  setScene() {
    this.scene = new THREE.Scene()
  }

  setCamera() {
    this.camera = new Camera()
  }

  setRenderer() {
    this.renderer = new Renderer({ rendererInstance: this.rendererInstance })

    this.targetElement.appendChild(this.renderer.instance.domElement)
  }

  setResources() {
    this.resources = new Resources(assets)
  }

  setWorld() {
    this.world = new World()
  }

  setControls() {
    this.gamepadEmulator = Axis.createGamepadEmulator(0)

    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 0, 'a', 2) // Gamepad button index 0 (PS4 X) to button "a" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 1, 'x', 2) // Gamepad button index 1 (PS4 Square) to button "x" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 2, 'i', 2) // Gamepad button index 2 (PS4 Circle) to button "i" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 3, 's', 2) // Gamepad button index 3 (PS4 Triangle) to button "s" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 7, 'w', 2) // Gamepad button index 3 (PS4 Triangle) to button "s" from group 1

    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 13, 'a', 1) // Gamepad button index 0 (PS4 X) to button "a" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 15, 'x', 1) // Gamepad button index 1 (PS4 Square) to button "x" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 14, 'i', 1) // Gamepad button index 2 (PS4 Circle) to button "i" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 12, 's', 1) // Gamepad button index 3 (PS4 Triangle) to button "s" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 6, 'w', 1) // Gamepad button index 3 (PS4 Triangle) to button "s" from group 1
  }

  setPlayers() {
    const player1 = Axis.createPlayer({
      id: 1,
      buttons: Axis.buttonManager.getButtonsById(1),
    })
    const player2 = Axis.createPlayer({
      id: 2,
      buttons: Axis.buttonManager.getButtonsById(2),
    })
    player1.model = this.resources.items.player1Model.scene
    player1.animations = this.resources.items.player1Model.animations
    player1.model.position.set(-0.7, 8.95, 4.6)
    player1.model.scale.set(0.5, 0.5, 0.5)
    player1.model.rotation.y = Math.PI
    player1.name = 'Player1'

    player2.model = this.resources.items.player2Model.scene
    player2.animations = this.resources.items.player2Model.animations
    player2.model.position.set(0.8, 8.95, 4.6)
    player2.model.scale.set(0.5, 0.5, 0.5)
    player2.model.rotation.y = Math.PI
    player2.name = 'Player2'

    player1.addEventListener('keydown', this.player1KeydownHandler)
    player2.addEventListener('keydown', this.player2KeydownHandler)

    this.players = [player1, player2]
  }

  player1KeydownHandler(e) {
    console.log('Joueur 1 : ' + e.key)
    document.querySelector('.input2').innerHTML = e.key
  }

  player2KeydownHandler(e) {
    console.log('Joueur 2 : ' + e.key)
    document.querySelector('.input').innerHTML = e.key
  }

  update() {
    if (this.stats) this.stats.update()

    this.camera.update()

    if (this.world) this.world.update()

    if (this.renderer) this.renderer.update()

    if (this.gamepadEmulator) this.gamepadEmulator.update()

    window.requestAnimationFrame(() => {
      this.update()
    })
  }

  resize() {
    // Config
    const boundings = this.targetElement.getBoundingClientRect()
    this.config.width = boundings.width
    this.config.height = boundings.height

    this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

    if (this.camera) this.camera.resize()

    if (this.renderer) this.renderer.resize()

    if (this.world) this.world.resize()
  }

  destroy() {}
}
