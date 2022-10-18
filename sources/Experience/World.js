import * as THREE from 'three'
import Experience from './Experience.js'

export default class World {
  constructor(_options) {
    this.experience = new Experience()
    this.config = this.experience.config
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.rotationSpeed = 0.005
    this.allMobs = []

    this.resources.on('groupEnd', (_group) => {
      if (_group.name === 'base') {
        this.experience.setPlayers()
        this.createWorld()
        this.createSkybox()
        this.createDestroyZone()
        this.initPlayers()

        setInterval(() => {
          this.spawnMob('blueMob', 'left')
          this.spawnMob('redMob', 'right')
        }, 500)
      }
    })
  }

  createWorld() {
    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xa9ff91 })
    )
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

  resize() {}

  update() {
    if (this.floor) {
      this.floor.rotation.x += this.rotationSpeed
      this.experience.players[0].mixer.update(
        this.experience.time.delta * 0.001
      )
    }

    for (const oneMob of this.allMobs) {
      if (oneMob.position.z > 5) {
        oneMob.traverse((object) => {
          if (object.isMesh) {
            object.geometry.dispose()
            object.material.dispose()
            this.scene.remove(object)
          }
        })
        console.log(oneMob)
        this.scene.remove(oneMob)
      }
    }
  }

  destroy() {}
}
