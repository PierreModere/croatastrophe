import * as THREE from 'three'
import { ceilPowerOfTwo } from 'three/src/math/MathUtils.js'
import Experience from './Experience.js'
import { gsap, Bounce, Power4 } from 'gsap'

export default class World {
  constructor(_options) {
    this.experience = new Experience()
    this.config = this.experience.config
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.isGameLaunched = false
    this.rotationSpeed = 0.05
    this.allMobs = []

    this.playerHealth = 5
    this.collisionDelta = 0
    this.collisionDelay = 1000
    this.weapons = []
    this.pressedBumpers = []

    this.spawnMobDelta = 0
    this.spawnMobDelay = 1000

    this.spawnPatternDelta = 0
    this.spawnPatternDelay = 3000

    this.switchWeaponsDelta = 0
    this.switchWeaponsDelay = 500

    this.mobPatterns = [
      // [
      //   [
      //     { type: 'blueMob', side: 'left' },
      //     { type: 'redMob', side: 'right' },
      //   ],
      //   [
      //     { type: 'blueMob', side: 'left' },
      //     { type: '', side: '' },
      //   ],
      //   [
      //     { type: '', side: '' },
      //     { type: 'redMob', side: 'right' },
      //   ],
      //   [
      //     { type: 'blueMob', side: 'left' },
      //     { type: 'redMob', side: 'right' },
      //   ],
      // ],
      [
        [
          { type: 'blueMob', side: 'left' },
          { type: 'redMob', side: 'right' },
        ],
        [
          { type: 'blueMob', side: 'left' },
          { type: '', side: '' },
        ],
        [
          { type: '', side: '' },
          { type: '', side: '' },
        ],
        [
          { type: 'redMob', side: 'left' },
          { type: 'blueMob', side: 'right' },
        ],
      ],
    ]

    this.mobPatternIndex = Math.floor(Math.random() * this.mobPatterns.length)
    this.mobLineIndex = 0

    this.resources.on('groupEnd', (_group) => {
      if (_group.name === 'base') {
        this.createWorld()
        // this.createSkybox()
        this.experience.assignModelToPlayers()
        this.initPlayers()
        this.experience.endLoadingAssets()
      }
    })

    this.resources.on('progress', (_group) => {
      const percentage = parseInt(100 - (_group.loaded / _group.toLoad) * 100)
      if (_group.name === 'base') {
        document.querySelector(
          '.logo__loader'
        ).style.clipPath = `inset(0 ${percentage}% 0 0)`
      }
    })
  }

  createWorld() {
    this.floor = new THREE.Group()

    this.floor.name = 'Floor'
    this.scene.add(this.floor)
    const planet = this.resources.items.planetModel.scene
    planet.name = 'Planet'
    planet.scale.set(2.17, 2.17, 2.17)
    // planet.getObjectByName('sphere_1').scale.set(1.5, 1, 1)
    this.floor.add(planet)

    const light = new THREE.DirectionalLight(0xffffff, 5)
    light.position.set(-0.6, 10.5, 6)
    this.scene.add(light)

    const helper = new THREE.DirectionalLightHelper(light, 1)
    this.scene.add(helper)
  }

  createSkybox() {
    const skyTexture = this.resources.items.castleTexture
    this.skySurface = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({
        map: skyTexture,
      })
    )
    this.skySurface.rotation.y = Math.PI * 2
    this.skySurface.position.y = 13
    this.skySurface.position.z = -10

    this.scene.add(this.skySurface)
  }

  initPlayers() {
    this.experience.players.forEach((player) => {
      if (player.model) {
        player.model.name = player.name
        player.model.traverse(function (object) {
          if (object.isMesh) {
            object.castShadow = true
            object.receiveShadow = true
          }
        })
        player.mixer = new THREE.AnimationMixer(player.model)
        const runAction = player.mixer.clipAction(player.animations[0]).play()
        player.actions = [runAction]
        this.scene.add(player.model)
      }
    })
    this.initWeapons()
    this.assignWeapons()
  }

  initWeapons() {
    this.redWeapon = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    this.redWeapon.name = 'redWeapon'

    this.blueWeapon = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    )
    this.blueWeapon.name = 'blueWeapon'
    this.weapons.push(this.redWeapon, this.blueWeapon)
  }

  assignWeapons() {
    this.experience.players.forEach((player) => {
      const weapon = this.weapons.filter((weapon) => {
        return weapon.name == player.weapon
      })[0]
      const targetParent = player.model.getObjectByName('mixamorigHeadTop_End')
      targetParent.attach(weapon)
      weapon.position.set(0, 30, 0)
    })
  }

  handlePlayersInputs = (e) => {
    if (e.key == 'a') {
      this.attackMob(e)
    }
    if (e.key == 'w') {
      if (this.pressedBumpers.indexOf(e.id) == -1) {
        this.pressedBumpers.push(e.id)
      }
      if (this.pressedBumpers.length == 2) {
        this.switchWeapons()
        this.pressedBumpers = []
        this.switchWeaponsDelta = 0
      }
    }
  }

  switchWeapons = (e) => {
    this.experience.player2.weapon = [
      this.experience.player1.weapon,
      (this.experience.player1.weapon = this.experience.player2.weapon),
    ][0]
    this.assignWeapons()
  }

  checkWeaponsSwitch() {
    if (this.pressedBumpers.length > 0) {
      this.switchWeaponsDelta += this.experience.time.delta

      if (this.switchWeaponsDelta >= this.switchWeaponsDelay) {
        this.pressedBumpers = []
        this.switchWeaponsDelta = 0
      }
    }
  }

  attackMob = (e) => {
    const playerID = e.id == 1 ? 0 : 1

    const keySide = e.id == 1 ? 'left' : 'right'

    const usedWeapon = this.experience.players[playerID].weapon

    for (const oneMob of this.allMobs) {
      if (
        oneMob.getWorldPosition(new THREE.Vector3()).z > 2 &&
        oneMob.side == keySide &&
        oneMob.weapon == usedWeapon
      ) {
        oneMob.hasBeenKilled = true
        gsap.to(oneMob.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.6,
          ease: Power4,

          onComplete: () => {
            this.removeMob(oneMob)
          },
        })
      }
    }
  }

  spawnMob(type, side) {
    if (!type || !side) return
    let position
    let mob
    if (side == 'left') {
      position = new THREE.Vector3(-0.7, 0, -11)
    } else if (side == 'right') {
      position = new THREE.Vector3(0.7, 0, -11)
    }

    if (type == 'blueMob') {
      mob = this.resources.items.blueMobModel.scene.clone()
      mob.weapon = 'blueWeapon'
    } else if (type == 'redMob') {
      mob = this.resources.items.redMobModel.scene.clone()
      mob.weapon = 'redWeapon'
    }
    mob.name = type
    mob.type = type
    mob.side = side
    mob.rotation.x = -Math.PI / 2

    this.scene.attach(mob)
    mob.position.set(position.x, position.y, position.z)
    this.floor.attach(mob)
    this.allMobs.push(mob)
  }

  removeMob(mob) {
    mob.traverse((object) => {
      if (object.isMesh) {
        object.geometry.dispose()
        object.material.dispose()
      }
    })
    this.floor.remove(mob)
    const index = this.allMobs.indexOf(mob)
    if (index > -1) {
      this.allMobs.splice(index, 1) // 2nd parameter means remove one item only
    }
  }

  spawnPattern() {
    this.spawnMobDelta += this.experience.time.delta

    // Check if it's time to spawn a mob
    if (this.spawnMobDelta >= this.spawnMobDelay) {
      // Check if there is still a mobLine to spawn
      if (this.mobLineIndex < this.mobPatterns[this.mobPatternIndex].length) {
        // Spawn the mobs of the line
        this.mobPatterns[this.mobPatternIndex][this.mobLineIndex].forEach(
          (mob) => {
            this.spawnMob(mob.type, mob.side)
          }
        )

        // Increment mobLine to go to next line or end the pattern
        this.mobLineIndex += 1
      } else {
        // If there is no more mobLine to spawn
        this.spawnPatternDelta += this.spawnMobDelta

        // Check if it's time to go to the next pattern
        if (this.spawnPatternDelta >= this.spawnPatternDelay) {
          // Reset the mobLine and chose a random mobPattern
          this.mobLineIndex = 0
          this.mobPatternIndex = Math.floor(
            Math.random() * this.mobPatterns.length
          )

          this.spawnPatternDelta = 0
        }
      }

      this.spawnMobDelta -= this.spawnMobDelay
    }
  }

  removeHeart() {
    this.playerHealth -= 1
    document.querySelector('.health').innerHTML = `${this.playerHealth}❤️`

    const tl = gsap.timeline()
    tl.to(this.experience.camera.instance.position, {
      x: 0.4,
      duration: 0.1,
      ease: Bounce,
    })
    tl.to(this.experience.camera.instance.position, {
      x: -0.4,
      duration: 0.2,
      ease: Bounce,
    })
    tl.to(this.experience.camera.instance.position, {
      x: 0,
      duration: 0.1,
      ease: Bounce,
    })

    tl.play()

    this.checkHealth()
  }

  checkHealth() {
    if (this.playerHealth <= 0) {
      this.experience.endGame()
    }
  }

  resize() {}

  update() {
    // Rotate world
    if (this.isGameLaunched) {
      this.floor.rotation.x += this.experience.time.delta * 0.0003
      this.experience.players.forEach((player) => {
        player.mixer.update(this.experience.time.delta * 0.001)
      })

      // Spawn mobs patterns
      this.spawnPattern()

      // Check bumpers
      this.checkWeaponsSwitch()

      // Remove mobs when outside of view
      for (const oneMob of this.allMobs) {
        // oneMob.position.y += Math.sin(this.experience.time.elapsed * 0.005) * 0.05
        if (oneMob.getWorldPosition(new THREE.Vector3()).z > 8) {
          this.removeMob(oneMob)
        }
        // Player collision
        if (
          oneMob.getWorldPosition(new THREE.Vector3()).z > 4 &&
          !oneMob.hasBeenKilled
        ) {
          this.removeHeart()
          this.removeMob(oneMob)
        }
      }
    }
  }

  destroy() {}
}
