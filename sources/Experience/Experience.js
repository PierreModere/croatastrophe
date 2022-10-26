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
import { gsap, Bounce, Power4 } from 'gsap'
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
    this.gameState = 'loading'

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

    this.config.pcMode = window.location.hash === '#PC'

    // Pixel ratio
    // this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)
    this.config.pixelRatio = 1

    // Width and height
    const boundings = this.targetElement.getBoundingClientRect()
    this.config.width = boundings.width
    this.config.height = boundings.height || window.innerHeight
  }

  setDebug() {
    if (this.config.debug) {
      this.debug = new GUI()
    }
    if (this.config.pcMode) {
      this.pcMode = true
    }
  }

  setStats() {
    if (this.config.debug) {
      this.stats = new Stats(true)
    }
  }

  setScene() {
    this.scene = new THREE.Scene()
    this.scene.background = null
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
    Axis.registerKeys(' ', 'w', 2) // keyboard key Space to button "w" from group 1

    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 13, 'a', 1) // Gamepad button index 0 (PS4 X) to button "a" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 15, 'x', 1) // Gamepad button index 1 (PS4 Square) to button "x" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 14, 'i', 1) // Gamepad button index 2 (PS4 Circle) to button "i" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 12, 's', 1) // Gamepad button index 3 (PS4 Triangle) to button "s" from group 1
    Axis.registerGamepadEmulatorKeys(this.gamepadEmulator, 6, 'w', 1) // Gamepad button index 3 (PS4 Triangle) to button "s" from group 1
    Axis.registerKeys('Enter', 'w', 1) // keyboard key "Enter" to button "w" from group 2

    Axis.joystick1.setGamepadEmulatorJoystick(this.gamepadEmulator, 0) // 0 is the joystick index of the gamepad, often the one on the left side
    Axis.joystick2.setGamepadEmulatorJoystick(this.gamepadEmulator, 1) // 1 is the joystick index of the gamepad, often the one on the right side

    // Exit game events
    Axis.addEventListener('exit:attempted', this.exitAttemptedHandler)
    Axis.addEventListener('exit:canceled', this.exitCanceledHandler)
    Axis.addEventListener(' exit:completed', () => {
      this.bgMusic.stop()
    })
  }

  exitAttemptedHandler = () => {
    document.querySelector('.playing-screen').style.display = 'none'
    document.querySelector('.deathScreen').style.display = 'none'
    this.gameState = 'pause'
    this.setEventListeners()
  }

  exitCanceledHandler = () => {
    document.querySelector('.playing-screen').style.display = 'block'
    document.querySelector('.deathScreen').style.display = 'block'
    this.gameState = 'playing'
    this.setEventListeners()
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
    this.player1.model.position.set(-1.3, 8.95, 8)
    this.player1.model.scale.set(1.8, 1.8, 1.8)
    this.player1.name = 'Player1'
    this.player1.weapon = 'redWeapon'
    this.player1.isAttacking = false
    this.player1.helmet = 'rougearmure001'
    this.player1.handle = 'Mesh001'

    this.player2.model = this.resources.items.player2Model.scene
    this.player2.animations = this.resources.items.player2Model.animations
    this.player2.model.position.set(1.2, 8.95, 8)
    this.player2.model.scale.set(1.8, 1.8, 1.8)
    this.player2.name = 'Player2'
    this.player2.weapon = 'blueWeapon'
    this.player2.isAttacking = false
    this.player2.helmet = 'bleuarmure001'
    this.player2.handle = 'Mesh002'
  }

  setEventListeners() {
    console.log(this.gameState)
    switch (this.gameState) {
      case 'loading':
        this.launchGame()
        this.playersMoving = false
        this.bgMusic = new Audio('/assets/sounds/bgMusic.ogg')
        this.deathSound = new Audio('/assets/sounds/deathSound.wav')
        this.deathMusic = new Audio('/assets/sounds/deathMusic.mp3')
        this.trumpetSound = new Audio('/assets/sounds/trumpetSound.mp3')
        this.symbalSound = new Audio('/assets/sounds/symbalSound.wav')

        this.menuInputSound = new Audio('/assets/sounds/menuInputPressed.wav')
        this.hurtSound = new Audio('/assets/sounds/hurtSound.ogg')
        this.hurtSoundPlaying = false
        // this.hurtSound.volume(2)

        // Display loading screen
        document.querySelector('.loading-screen').classList.add('is-display')

        break
      case 'menu':
        this.player1.addEventListener('keydown', this.launchIntro)
        this.player2.addEventListener('keydown', this.launchIntro)

        // Hide loading screen
        document.querySelector('.loading-screen').classList.add('outro')

        // Display starting screen
        document.querySelector('.starting-screen').classList.add('is-display')

        break
      case 'intro':
        break
      case 'debug':
        this.launchGame()
        break
      case 'playing':
        this.bgMusic.play()
        this.world.isGameLaunched = true

        this.player1.addEventListener('keydown', this.world.handlePlayersInputs)
        this.player2.addEventListener('keydown', this.world.handlePlayersInputs)

        // Animate players position

        if (!this.playersMoving) {
          this.players.forEach((player) => {
            gsap.to(player.model.position, {
              z: 4.6,
              duration: 2,
              ease: Power4.easeOut,
              onComplete: () => {
                this.playersMoving = true
              },
            })
          })
        }

        // Hide starting screen
        document.querySelector('.starting-screen').classList.add('outro')

        // Display UI
        const screen = document.querySelector('.playing-screen')
        screen.style.display = 'block'

        // Animate hearts
        gsap.from('.health__heart', {
          y: '-150%',
          opacity: 0,
          stagger: 0.1,
          ease: Bounce.easeOut,
        })

        // Animate controls
        gsap.from('.control-left', {
          rotate: '-110deg',
          duration: 1.5,
          ease: Bounce.easeOut,
        })
        gsap.from('.control-right', {
          rotate: '110deg',
          duration: 1.5,
          ease: Bounce.easeOut,
        })
        break
      case 'pause':
        this.bgMusic.pause()
        break
      case 'death':
        this.deathSound.play()
        this.deathMusic.play()
        this.bgMusic.pause()
        this.player1.addEventListener('keydown', this.assignDeathScreenInput)
        this.player2.addEventListener('keydown', this.assignDeathScreenInput)
        break
    }
  }

  launchGame = () => {
    this.player1.removeEventListener('keydown', this.launchGame)
    this.player2.removeEventListener('keydown', this.launchGame)
    // document.querySelector('.menu').classList.add('panelTransition')
    this.setResources()
    this.setWorld()
    // this.setEventListeners()
  }

  endLoadingAssets = () => {
    document.querySelector('.starting-screen').classList.add('is-loaded')
    this.gameState = 'menu'
    this.setEventListeners()
  }

  launchIntro = (e) => {
    if (e.key == 'a') {
      this.menuInputSound.play()
      this.player1.removeEventListener('keydown', this.launchIntro)
      this.player2.removeEventListener('keydown', this.launchIntro)
      this.gameState = 'playing'
      this.setEventListeners()
    }
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

  assignMenuInput = (e) => {}

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

    if (this.gameState != 'death' && this.gameState != 'pause') {
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

    this.config.pixelRatio = 1

    if (this.camera) this.camera.resize()

    if (this.renderer) this.renderer.resize()

    if (this.world) this.world.resize()
  }

  destroy() {}
}
