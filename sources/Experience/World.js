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
        this.createWorld()
        this.createSkybox()
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
    this.scene.add(this.floor)
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

  resize() {}

  update() {
    if (this.floor) this.floor.rotation.x += this.rotationSpeed
  }

  destroy() {}
}
