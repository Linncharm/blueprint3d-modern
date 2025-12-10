import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { QualityManager } from './quality-manager'

/**
 * Environment map manager for Image-Based Lighting (IBL)
 * Provides realistic reflections and ambient lighting
 */
export class EnvironmentManager {
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private pmremGenerator: THREE.PMREMGenerator | null = null
  private currentEnvMap: THREE.Texture | null = null
  private rgbeLoader: RGBELoader

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.renderer = renderer
    this.rgbeLoader = new RGBELoader()
  }

  /**
   * Load HDRI environment map from URL
   */
  async loadHDRI(url: string): Promise<THREE.Texture> {
    try {
      // Check if environment maps are enabled for current quality level
      if (!QualityManager.isEnvironmentMapEnabled()) {
        console.log('[EnvironmentManager] Environment maps disabled for current quality level')
        return this.createFallbackEnvironment()
      }

      console.log(`[EnvironmentManager] Loading HDRI: ${url}`)

      // Load HDRI texture
      const hdrTexture = await this.rgbeLoader.loadAsync(url)

      // Generate prefiltered environment map
      if (!this.pmremGenerator) {
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer)
        this.pmremGenerator.compileEquirectangularShader()
      }

      const envMap = this.pmremGenerator.fromEquirectangular(hdrTexture).texture

      // Apply to scene
      this.scene.environment = envMap

      // Optionally set as background (can be disabled for custom skybox)
      // this.scene.background = envMap

      // Cleanup
      hdrTexture.dispose()

      // Store reference
      this.currentEnvMap = envMap

      console.log('[EnvironmentManager] HDRI loaded successfully')
      return envMap
    } catch (error) {
      console.error('[EnvironmentManager] Failed to load HDRI:', error)
      return this.createFallbackEnvironment()
    }
  }

  /**
   * Create a procedural environment map (fallback/performance option)
   * Generates a simple gradient environment for reflection without loading HDRI
   */
  createProceduralEnvironment(topColor: number = 0xffffff, bottomColor: number = 0x999999): THREE.Texture {
    console.log('[EnvironmentManager] Creating procedural environment')

    // Create a simple gradient cube map
    const size = 128 // Small size for performance
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d')
    if (!context) {
      return this.createFallbackEnvironment()
    }

    // Create gradient
    const gradient = context.createLinearGradient(0, 0, 0, size)
    gradient.addColorStop(0, `#${topColor.toString(16).padStart(6, '0')}`)
    gradient.addColorStop(1, `#${bottomColor.toString(16).padStart(6, '0')}`)

    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace

    // Apply to scene
    this.scene.environment = texture
    this.currentEnvMap = texture

    return texture
  }

  /**
   * Create a fallback environment using CubeTexture with solid color
   */
  private createFallbackEnvironment(): THREE.Texture {
    console.log('[EnvironmentManager] Creating fallback environment')

    // Create a simple neutral environment
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256)
    cubeRenderTarget.texture.type = THREE.HalfFloatType

    const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget)

    // Simple scene with ambient light for neutral environment
    const tempScene = new THREE.Scene()
    tempScene.background = new THREE.Color(0xcccccc)

    cubeCamera.update(this.renderer, tempScene)

    const envMap = cubeRenderTarget.texture
    this.scene.environment = envMap
    this.currentEnvMap = envMap

    return envMap
  }

  /**
   * Load default interior environment
   * This can be customized to load specific HDRIs from your asset folder
   */
  async loadDefaultEnvironment(): Promise<THREE.Texture> {
    // For now, use procedural environment
    // In production, you would load a real HDRI:
    // return await this.loadHDRI('/path/to/studio_small_08_1k.hdr')

    if (QualityManager.isEnvironmentMapEnabled()) {
      return this.createProceduralEnvironment(0xe8f4ff, 0xb8c5d6)
    } else {
      return this.createFallbackEnvironment()
    }
  }

  /**
   * Update environment map quality based on quality settings
   */
  async updateQuality(): Promise<void> {
    if (QualityManager.isEnvironmentMapEnabled() && !this.currentEnvMap) {
      // Load environment if quality upgraded
      await this.loadDefaultEnvironment()
    } else if (!QualityManager.isEnvironmentMapEnabled() && this.currentEnvMap) {
      // Remove environment if quality downgraded
      this.dispose()
      this.scene.environment = null
    }
  }

  /**
   * Get current environment map
   */
  getCurrentEnvironment(): THREE.Texture | null {
    return this.currentEnvMap
  }

  /**
   * Remove environment map
   */
  removeEnvironment(): void {
    this.scene.environment = null
    if (this.currentEnvMap) {
      this.currentEnvMap.dispose()
      this.currentEnvMap = null
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose()
      this.pmremGenerator = null
    }

    if (this.currentEnvMap) {
      this.currentEnvMap.dispose()
      this.currentEnvMap = null
    }
  }
}
