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
import { ceilPowerOfTwo } from 'three/src/math/MathUtils.js'

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
    this.gameState = 'menu'

    this.setConfig()
    this.setDebug()
    this.setStats()
    this.setScene()
    this.setCamera()
    this.setRenderer()
    this.setControls()
    this.setPlayers()

    // this.setResources()
    // this.setWorld()
    // this.setControls()

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

    Axis.registerKeys('q', 'a', 1) // keyboard key "q" to button "a" from group 1
    Axis.registerKeys('d', 'x', 1) // keyboard key "d" to button "x" from group 1
    Axis.registerKeys('z', 'i', 1) // keyboard key "z" to button "i" from group 1
    Axis.registerKeys('s', 's', 1) // keyboard key "s" to button "s" from group 1

    Axis.registerKeys('ArrowLeft', 'a', 2) // keyboard key "ArrowLeft" to button "a" from group 2
    Axis.registerKeys('ArrowRight', 'x', 2) // keyboard key "ArrowRight" to button "x" from group 2
    Axis.registerKeys('ArrowUp', 'i', 2) // keyboard key "ArrowUp" to button "i" from group 2
    Axis.registerKeys('ArrowDown', 's', 2) // keyboard key "ArrowDown" to button "s" from group 2
    Axis.registerKeys('Enter', 'w', 2) // keyboard key "Enter" to button "w" from group 2

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

    Axis.joystick1.setGamepadEmulatorJoystick(this.gamepadEmulator, 0) // 0 is the joystick index of the gamepad, often the one on the left side
    Axis.joystick2.setGamepadEmulatorJoystick(this.gamepadEmulator, 1) // 1 is the joystick index of the gamepad, often the one on the right side
  }

  setPlayers() {
    this.player1 = Axis.createPlayer({
      id: 1,
      buttons: Axis.buttonManager.getButtonsById(1),
      joysticks: Axis.joystick1,
    })
    this.player2 = Axis.createPlayer({
      id: 2,
      buttons: Axis.buttonManager.getButtonsById(2),
      joysticks: Axis.joystick2,
    })

    this.players = [this.player1, this.player2]
    this.setEventListeners()
  }

  assignModelToPlayers() {
    this.player1.model = this.resources.items.player1Model.scene
    this.player1.animations = this.resources.items.player1Model.animations
    this.player1.model.position.set(-0.7, 8.95, 4.6)
    this.player1.model.scale.set(0.5, 0.5, 0.5)
    this.player1.model.rotation.y = Math.PI
    this.player1.name = 'Player1'
    this.player1.weapon = 'blueWeapon'

    this.player2.model = this.resources.items.player2Model.scene
    this.player2.animations = this.resources.items.player2Model.animations
    this.player2.model.position.set(0.8, 8.95, 4.6)
    this.player2.model.scale.set(0.5, 0.5, 0.5)
    this.player2.model.rotation.y = Math.PI
    this.player2.name = 'Player2'
    this.player2.weapon = 'redWeapon'
  }

  setEventListeners() {
    console.log(this.gameState)
    switch (this.gameState) {
      case 'menu':
        this.player1.addEventListener('keydown', this.launchGame)
        this.player2.addEventListener('keydown', this.launchGame)
        break
      case 'intro':
        break
      case 'debug':
        this.launchGame()
        break
      case 'playing':
        this.player1.addEventListener('keydown', this.world.attackMob)
        this.player2.addEventListener('keydown', this.world.attackMob)
        break
      case 'pause':
        break
      case 'death':
        this.player1.addEventListener('keydown', this.assignDeathScreenInput)
        this.player2.addEventListener('keydown', this.assignDeathScreenInput)
        break
    }
  }

  launchGame = () => {
    this.player1.removeEventListener('keydown', this.launchGame)
    this.player2.removeEventListener('keydown', this.launchGame)
    document.querySelector('.menu').classList.add('panelTransition')
    this.setResources()
    this.setWorld()
    this.gameState = 'loading'
    this.setEventListeners()
  }

  endLoadingAssets = () => {
    document.querySelector('.loadingScreen').classList.add('panelTransition')
    this.gameState = 'playing'
    this.setEventListeners()
  }

  endGame = () => {
    this.player1.removeEventListener('keydown', this.world.attackMob)
    this.player2.removeEventListener('keydown', this.world.attackMob)
    document
      .querySelector('.deathScreen')
      .classList.add('deathScreenTransition')
    this.gameState = 'death'
    this.setEventListeners()
  }

  assignDeathScreenInput = (e) => {
    switch (e.key) {
      case 'a':
        window.location.reload()
        break

      default:
        break
    }
  }

  setGameState() {}

  update() {
    if (this.stats) this.stats.update()

    if (this.gameState != 'death') {
      this.camera.update()

      if (this.world) this.world.update()

      if (this.renderer) this.renderer.update()
    }

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
