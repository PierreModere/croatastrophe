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
    this.rotationSpeed = 0.005
    this.allMobs = []
    this.counter = 0
    this.spawningDelay = 1000
    this.previousPatterDone = false

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
        [{ type: 'redMob', side: 'right' }],
        [
          { type: 'blueMob', side: 'left' },
          { type: 'redMob', side: 'right' },
        ],
      ],

      [
        [
          { type: 'redMob', side: 'left' },
          { type: 'blueMob', side: 'right' },
        ],
        [{ type: 'redMob', side: 'left' }],
        [{ type: 'blueMob', side: 'right' }],
        [
          { type: 'redMob', side: 'left' },
          { type: 'blueMob', side: 'right' },
        ],
      ],
    ]

    this.resources.on('groupEnd', (_group) => {
      if (_group.name === 'base') {
        this.experience.setPlayers()
        this.createWorld()
        this.createSkybox()
        this.createDestroyZone()
        this.initPlayers()
        // this.initMobs()

        // setInterval(() => {
        //   this.spawnMob('blueMob', 'left')
        //   this.spawnMob('redMob', 'right')
        // }, 500)
      }
    })
  }

  initMobs() {
    gsap.set('.experience', {
      delay: 1,
      onRepeat: this.spawnMob('blueMob', 'right'),
      repeat: -1,
      repeatDelay: 1,
    })
  }

  createWorld() {
    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xa9ff91 })
    )
    this.sphere.scale.x = 2

    this.torus = new THREE.Mesh(
      new THREE.CylinderGeometry(10.1, 10.1, 3, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xbac1ca })
    )
    this.torus.rotation.z = Math.PI / 2
    this.floor = new THREE.Group()
    this.floor.add(this.sphere)
    this.floor.add(this.torus)
    this.floor.name = 'Floor'
    this.scene.add(this.floor)
    this.torus.receiveShadow = true

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

  createDestroyZone() {
    this.destroyZone = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
    )
    this.destroyZone.name = 'destroyZone'
    this.destroyZone.position.set(0, 4, 10)
    this.scene.add(this.destroyZone)
  }

  initPlayers() {
    this.experience.players.forEach((player) => {
      if (player.model) {
        player.model.name = 'player1'
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
    this.mobPatterns[0].forEach((mobLine) => {
      if (!mobLine.done) {
        mobLine.forEach((mob) => {
          this.spawnMob(mob.type, mob.side)
        })
        mobLine.done = true
      }
    })
  }

  resize() {}

  update() {
    if (this.floor) {
      this.floor.rotation.x += this.rotationSpeed
      this.experience.players.forEach((player) => {
        player.mixer.update(this.experience.time.delta * 0.001)
      })
    }

    this.counter += this.experience.time.delta
    if (this.counter >= this.spawningDelay && !this.previousPatterDone) {
      this.spawnPattern()
      this.counter -= this.spawningDelay
    }

    for (const oneMob of this.allMobs) {
      // console.log(
      //   this.allMobs[0]
      //     .getWorldPosition(new THREE.Vector3())
      //     .distanceTo(this.scene.getObjectByName('player1').position)
      // )

      if (oneMob.getWorldPosition(new THREE.Vector3()).z > 8)
        this.removeMob(oneMob)
    }
  }

  destroy() {}
}
