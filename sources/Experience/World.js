import * as THREE from 'three'
import { ceilPowerOfTwo } from 'three/src/math/MathUtils.js'
import Experience from './Experience.js'
import gsap from 'gsap'

export default class World {
  constructor(_options) {
    this.experience = new Experience()
    this.config = this.experience.config
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.rotationSpeed = 0.003
    this.allMobs = []

    this.spawnMobDelta = 0
    this.spawnMobDelay = 1000

    this.spawnPatternDelta = 0
    this.spawnPatternDelay = 3000

    this.mobPatternIndex = 0
    this.mobLineIndex = 0

    this.mobPatterns = [
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
          { type: 'redMob', side: 'right' },
        ],
        [
          { type: 'blueMob', side: 'left' },
          { type: 'redMob', side: 'right' },
        ],
      ],
    ]

    this.resources.on('groupEnd', (_group) => {
      if (_group.name === 'base') {
        this.experience.setPlayers()
        this.createWorld()
        this.createSkybox()
        this.initPlayers()
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
    console.log(this.resources.items.blueMobModel.scene)

    if (type == 'blueMob') {
      mob = this.resources.items.blueMobModel.scene.clone()
    } else if (type == 'redMob') {
      mob = this.resources.items.redMobModel.scene.clone()
    }
    mob.name = type
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
        console.log('spawnPatternDelta: ' + this.spawnPatternDelta)

        // Check if it's time to go to the next pattern
        if (this.spawnPatternDelta >= this.spawnPatternDelay) {
          // Reset the mobLine and chose a random mobPattern
          this.mobLineIndex = 0
          this.mobPatternIndex = 0 // TODO: random between O and this.mobPatterns.length - 1

          this.spawnPatternDelta = 0
        }
      }

      this.spawnMobDelta -= this.spawnMobDelay
    }
  }

  resize() {}

  update() {
    // Rotate world
    if (this.floor) {
      this.floor.rotation.x += this.rotationSpeed
      this.experience.players.forEach((player) => {
        player.mixer.update(this.experience.time.delta * 0.001)
      })
    }

    // Spawn mobs patterns
    this.spawnPattern()

    // Remove mobs when outside of view
    for (const oneMob of this.allMobs) {
      if (oneMob.getWorldPosition(new THREE.Vector3()).z > 8) {
        this.removeMob(oneMob)
      }
    }
  }

  destroy() {}
}
