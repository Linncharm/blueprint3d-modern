import * as THREE from 'three'
import { QualityManager } from './quality-manager'
import type { Floorplan } from '../model/floorplan'

/**
 * Enhanced lighting system with multiple light sources and quality-based configuration
 * Designed to create realistic interior lighting similar to professional 3D tools
 */
export class Lights {
  private readonly scene: THREE.Scene
  private readonly floorplan: Floorplan
  private readonly tol = 1
  private readonly height = 300 // Room height in cm

  // Light sources
  private ambientLight!: THREE.AmbientLight
  private dirLight!: THREE.DirectionalLight // Main light (sun/window)
  private fillLight1!: THREE.DirectionalLight // Fill light 1
  private fillLight2!: THREE.DirectionalLight // Fill light 2
  private hemisphereLight?: THREE.HemisphereLight // Optional sky light

  constructor(scene: THREE.Scene, floorplan: Floorplan) {
    this.scene = scene
    this.floorplan = floorplan
    this.init()
  }

  public getDirLight(): THREE.DirectionalLight {
    return this.dirLight
  }

  private init(): void {
    this.setupLights()
    this.floorplan.fireOnUpdatedRooms(this.updateShadowCamera.bind(this))

    // Listen for quality changes
    if (typeof window !== 'undefined') {
      window.addEventListener('quality-changed', this.onQualityChanged.bind(this))
    }
  }

  /**
   * Setup all lights based on current quality level
   */
  private setupLights(): void {
    const maxLights = QualityManager.getMaxLights()

    // 1. Ambient Light (always present) - base illumination
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    this.scene.add(this.ambientLight)

    // 2. Main Directional Light (always present) - primary light with shadows
    // Warm white color for natural sunlight/window light
    this.dirLight = new THREE.DirectionalLight(0xfff4e6, 1.5)
    this.dirLight.position.set(10, 20, 10)
    this.dirLight.castShadow = true
    this.configureShadows(this.dirLight)
    this.scene.add(this.dirLight)
    this.scene.add(this.dirLight.target)

    // 3. Fill Light 1 (added in MEDIUM+ quality) - soften shadows
    if (maxLights >= 2) {
      // Cool white color for balanced lighting
      this.fillLight1 = new THREE.DirectionalLight(0xe8f4ff, 0.5)
      this.fillLight1.position.set(-10, 15, -10)
      this.fillLight1.castShadow = false // Fill lights don't cast shadows (performance)
      this.scene.add(this.fillLight1)
    }

    // 4. Fill Light 2 (added in HIGH/ULTRA quality) - additional fill
    if (maxLights >= 3) {
      this.fillLight2 = new THREE.DirectionalLight(0xfff4e6, 0.3)
      this.fillLight2.position.set(0, 10, -15)
      this.fillLight2.castShadow = false
      this.scene.add(this.fillLight2)
    }

    // 5. Hemisphere Light (added in ULTRA quality) - sky/ground ambient
    if (maxLights >= 4) {
      this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.5)
      this.hemisphereLight.position.set(0, this.height, 0)
      this.scene.add(this.hemisphereLight)
    }
  }

  /**
   * Configure shadow settings for a light based on quality level
   */
  private configureShadows(light: THREE.DirectionalLight): void {
    const shadowMapSize = QualityManager.getShadowMapSize()

    // Shadow map resolution
    light.shadow.mapSize.width = shadowMapSize
    light.shadow.mapSize.height = shadowMapSize

    // Shadow camera configuration
    light.shadow.camera.far = this.height + this.tol

    // Improved shadow bias to reduce shadow acne
    light.shadow.bias = -0.00005 // Reduced from -0.0001 for cleaner shadows
    light.shadow.normalBias = 0.02 // Add normal bias for additional quality

    // PCF shadow radius for soft shadows (requires PCFSoftShadowMap)
    if (QualityManager.getShadowMapType() === THREE.PCFSoftShadowMap) {
      light.shadow.radius = 2
    }
  }

  /**
   * Update shadow camera to match floorplan size
   */
  private updateShadowCamera(): void {
    const size = this.floorplan.getSize()
    const d = (Math.max(size.z, size.x) + this.tol) / 2.0

    const center = this.floorplan.getCenter()
    const pos = new THREE.Vector3(center.x, this.height, center.z)

    // Update main light position
    this.dirLight.position.copy(pos)
    this.dirLight.target.position.copy(center)

    // Update shadow camera bounds
    this.dirLight.shadow.camera.left = -d
    this.dirLight.shadow.camera.right = d
    this.dirLight.shadow.camera.top = d
    this.dirLight.shadow.camera.bottom = -d
    this.dirLight.shadow.camera.updateProjectionMatrix()

    // Update fill lights if they exist
    if (this.fillLight1) {
      const fillPos1 = new THREE.Vector3(center.x - d / 2, this.height * 0.75, center.z - d / 2)
      this.fillLight1.position.copy(fillPos1)
    }

    if (this.fillLight2) {
      const fillPos2 = new THREE.Vector3(center.x, this.height * 0.5, center.z - d)
      this.fillLight2.position.copy(fillPos2)
    }
  }

  /**
   * Handle quality level changes
   */
  private onQualityChanged(): void {
    console.log('[Lights] Quality changed, reconfiguring lights...')

    // Remove all existing lights
    this.removeLights()

    // Setup lights with new quality settings
    this.setupLights()

    // Update shadow camera with current floorplan size
    this.updateShadowCamera()
  }

  /**
   * Remove all lights from the scene
   */
  private removeLights(): void {
    if (this.ambientLight) this.scene.remove(this.ambientLight)
    if (this.dirLight) {
      this.scene.remove(this.dirLight)
      this.scene.remove(this.dirLight.target)
    }
    if (this.fillLight1) this.scene.remove(this.fillLight1)
    if (this.fillLight2) this.scene.remove(this.fillLight2)
    if (this.hemisphereLight) this.scene.remove(this.hemisphereLight)
  }

  /**
   * Update shadow map quality (called when quality changes)
   */
  public updateShadowQuality(): void {
    this.configureShadows(this.dirLight)
  }

  /**
   * Dispose of lights (cleanup)
   */
  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('quality-changed', this.onQualityChanged.bind(this))
    }
    this.removeLights()
  }
}
