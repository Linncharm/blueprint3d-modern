import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { QualityManager } from './quality-manager'

/**
 * Post-processing manager
 * Handles screen-space effects like SSAO, Bloom, and anti-aliasing
 */
export class PostProcessingManager {
  private composer: EffectComposer
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.Camera

  // Passes
  private renderPass!: RenderPass
  private ssaoPass: SSAOPass | null = null
  private bloomPass: UnrealBloomPass | null = null
  private smaaPass: SMAAPass | null = null
  private fxaaPass: ShaderPass | null = null
  private outputPass!: OutputPass

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera

    // Initialize composer
    this.composer = new EffectComposer(renderer)

    // Setup post-processing pipeline
    this.setupPipeline()

    // Listen for quality changes
    if (typeof window !== 'undefined') {
      window.addEventListener('quality-changed', this.onQualityChanged.bind(this))
    }
  }

  /**
   * Setup the post-processing pipeline
   */
  private setupPipeline(): void {
    // 1. Base render pass (render the scene)
    this.renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(this.renderPass)

    // 2. SSAO (Screen Space Ambient Occlusion)
    if (QualityManager.isSSAOEnabled()) {
      this.setupSSAO()
    }

    // 3. Bloom effect
    if (QualityManager.isBloomEnabled()) {
      this.setupBloom()
    }

    // 4. Anti-aliasing (SMAA or FXAA)
    this.setupAntiAliasing()

    // 5. Output pass (final color space conversion)
    this.outputPass = new OutputPass()
    this.composer.addPass(this.outputPass)

    console.log('[PostProcessing] Pipeline configured')
  }

  /**
   * Setup SSAO (Screen Space Ambient Occlusion)
   */
  private setupSSAO(): void {
    this.ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight)

    // Configure SSAO parameters based on quality
    const qualityLevel = QualityManager.getCurrentLevel()

    if (qualityLevel === 'ultra') {
      this.ssaoPass.kernelRadius = 16
      this.ssaoPass.kernelSize = 32
    } else {
      this.ssaoPass.kernelRadius = 8
      this.ssaoPass.kernelSize = 16
    }

    this.ssaoPass.minDistance = 0.001
    this.ssaoPass.maxDistance = 0.1

    // Output mode: Default blends SSAO with scene
    // @ts-ignore - SSAOPass.OUTPUT is available
    if (SSAOPass.OUTPUT) {
      // @ts-ignore
      this.ssaoPass.output = SSAOPass.OUTPUT.Default
    }

    this.composer.addPass(this.ssaoPass)
    console.log('[PostProcessing] SSAO enabled')
  }

  /**
   * Setup Bloom effect
   */
  private setupBloom(): void {
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight)

    this.bloomPass = new UnrealBloomPass(
      resolution,
      0.4, // strength - subtle bloom
      0.8, // radius
      0.85 // threshold - only bright surfaces
    )

    this.composer.addPass(this.bloomPass)
    console.log('[PostProcessing] Bloom enabled')
  }

  /**
   * Setup anti-aliasing
   */
  private setupAntiAliasing(): void {
    if (QualityManager.isSMAAEnabled()) {
      // SMAA (Subpixel Morphological Anti-Aliasing) - higher quality
      const pixelRatio = this.renderer.getPixelRatio()
      this.smaaPass = new SMAAPass(
        window.innerWidth * pixelRatio,
        window.innerHeight * pixelRatio
      )
      this.composer.addPass(this.smaaPass)
      console.log('[PostProcessing] SMAA enabled')
    } else if (QualityManager.getCurrentSettings().enablePostProcessing) {
      // FXAA (Fast Approximate Anti-Aliasing) - fallback
      this.fxaaPass = new ShaderPass(FXAAShader)

      const pixelRatio = this.renderer.getPixelRatio()
      // @ts-ignore - FXAAShader has resolution uniform
      this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio)
      // @ts-ignore
      this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio)

      this.composer.addPass(this.fxaaPass)
      console.log('[PostProcessing] FXAA enabled')
    }
  }

  /**
   * Render with post-processing
   */
  render(): void {
    this.composer.render()
  }

  /**
   * Resize post-processing buffers
   */
  resize(width: number, height: number): void {
    this.composer.setSize(width, height)

    // Update SSAO resolution
    if (this.ssaoPass) {
      this.ssaoPass.setSize(width, height)
    }

    // Update Bloom resolution
    if (this.bloomPass) {
      const resolution = new THREE.Vector2(width, height)
      // @ts-ignore - UnrealBloomPass has resolution property
      this.bloomPass.resolution = resolution
    }

    // Update FXAA resolution
    if (this.fxaaPass) {
      const pixelRatio = this.renderer.getPixelRatio()
      // @ts-ignore
      this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio)
      // @ts-ignore
      this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio)
    }

    // Update SMAA resolution
    if (this.smaaPass) {
      // SMAA doesn't need manual resolution update
    }
  }

  /**
   * Handle quality changes
   */
  private onQualityChanged(): void {
    console.log('[PostProcessing] Quality changed, rebuilding pipeline...')

    // Rebuild the entire pipeline
    this.dispose()

    // Recreate composer
    this.composer = new EffectComposer(this.renderer)

    // Setup new pipeline
    this.setupPipeline()

    // Ensure correct size
    this.resize(window.innerWidth, window.innerHeight)
  }

  /**
   * Enable/disable specific effects
   */
  setSSAOEnabled(enabled: boolean): void {
    if (this.ssaoPass) {
      this.ssaoPass.enabled = enabled
    }
  }

  setBloomEnabled(enabled: boolean): void {
    if (this.bloomPass) {
      this.bloomPass.enabled = enabled
    }
  }

  /**
   * Adjust Bloom parameters at runtime
   */
  setBloomStrength(strength: number): void {
    if (this.bloomPass) {
      this.bloomPass.strength = strength
    }
  }

  setBloomThreshold(threshold: number): void {
    if (this.bloomPass) {
      this.bloomPass.threshold = threshold
    }
  }

  setBloomRadius(radius: number): void {
    if (this.bloomPass) {
      this.bloomPass.radius = radius
    }
  }

  /**
   * Get the composer (for advanced usage)
   */
  getComposer(): EffectComposer {
    return this.composer
  }

  /**
   * Dispose of all post-processing resources
   */
  dispose(): void {
    // Remove passes
    if (this.ssaoPass) {
      this.ssaoPass.dispose?.()
      this.ssaoPass = null
    }

    if (this.bloomPass) {
      this.bloomPass.dispose?.()
      this.bloomPass = null
    }

    if (this.smaaPass) {
      this.smaaPass.dispose?.()
      this.smaaPass = null
    }

    if (this.fxaaPass) {
      this.fxaaPass.dispose?.()
      this.fxaaPass = null
    }

    // Dispose composer (will dispose all passes)
    this.composer.dispose?.()

    // Remove event listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('quality-changed', this.onQualityChanged.bind(this))
    }
  }
}
