import * as THREE from 'three'
import Experience from './Experience.js'

export default class World {
  constructor(_options) {
    this.experience = new Experience()
    this.config = this.experience.config
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.rotationSpeed = 0.005

    this.resources.on('groupEnd', (_group) => {
      if (_group.name === 'base') {
        this.experience.setPlayers()
        this.createWorld()
        this.createSkybox()
        this.createPlayers()
      }
    })
  }

  createWorld() {
    this.resources.items.lennaTexture.encoding = THREE.sRGBEncoding

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

  createPlayers() {
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
    if (side == 'left') {
      position = new THREE.Vector3(-0.7, 0, -11)
    } else if (side == 'right') {
      position = new THREE.Vector3(0.7, 0, -11)
    }

    let model = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshBasicMaterial({ map: null })
    )

    const blueMobTexture = this.resources.items.blueMobTexture
    blueMobTexture.flipY = false
    const redMobTexture = this.resources.items.redMobTexture
    redMobTexture.flipY = false

    if (type == 'blueMob') {
      model.material.map = blueMobTexture
    } else if (type == 'redMob') {
      model.material.map = redMobTexture
    }

    // // let model = this.resources.items.shibaModel.scene
    // const materialToChange = [
    //   model.getObjectByName('Box002_default_0'),
    //   model.getObjectByName('Group18985_default_0'),
    // ]

    // if (type == 'blueMob') {
    //   materialToChange.forEach((object) => {
    //     object.material.map = blueMobTexture
    //   })
    // } else if (type == 'redMob') {
    //   materialToChange.forEach((object) => {
    //     object.material.map = redMobTexture
    //   })
    // }
    model.name = type
    model.position.set(position.x, position.y, position.z)
    model.rotation.x = -Math.PI / 2

    this.floor.add(model)
  }

  resize() {}

  update() {
    if (this.floor) {
      this.floor.rotation.x += this.rotationSpeed
      this.experience.players[0].mixer.update(
        this.experience.time.delta * 0.001
      )
    }
  }

  destroy() {}
}
