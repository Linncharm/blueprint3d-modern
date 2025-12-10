import * as THREE from 'three'
import { QualityManager } from './quality-manager'

/**
 * Material presets for PBR workflow
 */
export enum MaterialPreset {
  WOOD = 'wood',
  METAL = 'metal',
  FABRIC = 'fabric',
  GLASS = 'glass',
  CONCRETE = 'concrete',
  TILE = 'tile',
  PLASTIC = 'plastic',
  WALL = 'wall',
  FLOOR_WOOD = 'floor_wood',
  FLOOR_TILE = 'floor_tile',
  FLOOR_CARPET = 'floor_carpet'
}

/**
 * PBR material configuration
 */
export interface PBRMaterialConfig {
  color: number
  roughness: number
  metalness: number
  envMapIntensity: number
  // Optional texture maps
  roughnessMap?: THREE.Texture
  metalnessMap?: THREE.Texture
  normalMap?: THREE.Texture
  aoMap?: THREE.Texture
  // For transparent materials
  transparent?: boolean
  opacity?: number
  transmission?: number // For glass (MeshPhysicalMaterial)
}

/**
 * Material library for PBR workflow
 * Provides preset materials and utilities for creating high-quality materials
 */
export class MaterialLibrary {
  private static textureLoader = new THREE.TextureLoader()

  /**
   * Get preset material configuration
   */
  static getPreset(preset: MaterialPreset): PBRMaterialConfig {
    const presets: Record<MaterialPreset, PBRMaterialConfig> = {
      [MaterialPreset.WOOD]: {
        color: 0xb8956a,
        roughness: 0.8,
        metalness: 0.0,
        envMapIntensity: 0.2
      },
      [MaterialPreset.METAL]: {
        color: 0xcccccc,
        roughness: 0.3,
        metalness: 1.0,
        envMapIntensity: 1.0
      },
      [MaterialPreset.FABRIC]: {
        color: 0xe6e6e6,
        roughness: 0.9,
        metalness: 0.0,
        envMapIntensity: 0.1
      },
      [MaterialPreset.GLASS]: {
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.0,
        envMapIntensity: 1.0,
        transparent: true,
        opacity: 0.5,
        transmission: 1.0
      },
      [MaterialPreset.CONCRETE]: {
        color: 0xaaaaaa,
        roughness: 0.9,
        metalness: 0.0,
        envMapIntensity: 0.1
      },
      [MaterialPreset.TILE]: {
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.0,
        envMapIntensity: 0.4
      },
      [MaterialPreset.PLASTIC]: {
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.0,
        envMapIntensity: 0.3
      },
      [MaterialPreset.WALL]: {
        color: 0xffffff,
        roughness: 0.85,
        metalness: 0.0,
        envMapIntensity: 0.2
      },
      [MaterialPreset.FLOOR_WOOD]: {
        color: 0xb8956a,
        roughness: 0.7,
        metalness: 0.0,
        envMapIntensity: 0.3
      },
      [MaterialPreset.FLOOR_TILE]: {
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.0,
        envMapIntensity: 0.5
      },
      [MaterialPreset.FLOOR_CARPET]: {
        color: 0xe6e6e6,
        roughness: 0.95,
        metalness: 0.0,
        envMapIntensity: 0.05
      }
    }

    return presets[preset] || presets[MaterialPreset.WOOD]
  }

  /**
   * Create a standard PBR material
   */
  static createStandardMaterial(
    preset: MaterialPreset,
    overrides?: Partial<THREE.MeshStandardMaterialParameters>
  ): THREE.MeshStandardMaterial {
    const config = this.getPreset(preset)
    const params: THREE.MeshStandardMaterialParameters = {
      color: config.color,
      roughness: config.roughness,
      metalness: config.metalness,
      envMapIntensity: config.envMapIntensity,
      ...overrides
    }

    return new THREE.MeshStandardMaterial(params)
  }

  /**
   * Create a physical material (with transmission for glass)
   */
  static createPhysicalMaterial(
    preset: MaterialPreset,
    overrides?: Partial<THREE.MeshPhysicalMaterialParameters>
  ): THREE.MeshPhysicalMaterial {
    const config = this.getPreset(preset)
    const params: THREE.MeshPhysicalMaterialParameters = {
      color: config.color,
      roughness: config.roughness,
      metalness: config.metalness,
      envMapIntensity: config.envMapIntensity,
      transparent: config.transparent,
      opacity: config.opacity,
      transmission: config.transmission,
      ...overrides
    }

    return new THREE.MeshPhysicalMaterial(params)
  }

  /**
   * Configure texture with quality-based settings
   */
  static configureTexture(texture: THREE.Texture, renderer: THREE.WebGLRenderer): THREE.Texture {
    // Color space
    texture.colorSpace = THREE.SRGBColorSpace

    // Anisotropic filtering based on quality
    const anisotropy = Math.min(
      QualityManager.getAnisotropy(),
      renderer.capabilities.getMaxAnisotropy()
    )
    texture.anisotropy = anisotropy

    // Wrapping mode for tiling
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    return texture
  }

  /**
   * Load and configure a texture
   */
  static loadTexture(url: string, renderer: THREE.WebGLRenderer): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          this.configureTexture(texture, renderer)
          resolve(texture)
        },
        undefined,
        reject
      )
    })
  }

  /**
   * Convert old Phong material to PBR Standard material
   * Used for upgrading legacy models
   */
  static convertPhongToStandard(
    phongMaterial: THREE.MeshPhongMaterial,
    envMap?: THREE.Texture
  ): THREE.MeshStandardMaterial {
    const standardMaterial = new THREE.MeshStandardMaterial({
      color: phongMaterial.color,
      map: phongMaterial.map,
      emissive: phongMaterial.emissive,
      emissiveMap: phongMaterial.emissiveMap,
      emissiveIntensity: phongMaterial.emissiveIntensity,
      normalMap: phongMaterial.normalMap,
      alphaMap: phongMaterial.alphaMap,
      envMap: envMap,
      envMapIntensity: 0.5,
      // Default PBR values
      roughness: 0.7,
      metalness: 0.0,
      // Preserve other properties
      side: phongMaterial.side,
      transparent: phongMaterial.transparent,
      opacity: phongMaterial.opacity,
      depthTest: phongMaterial.depthTest,
      depthWrite: phongMaterial.depthWrite
    })

    return standardMaterial
  }

  /**
   * Convert Basic material to PBR Standard material
   */
  static convertBasicToStandard(
    basicMaterial: THREE.MeshBasicMaterial,
    envMap?: THREE.Texture
  ): THREE.MeshStandardMaterial {
    const standardMaterial = new THREE.MeshStandardMaterial({
      color: basicMaterial.color,
      map: basicMaterial.map,
      alphaMap: basicMaterial.alphaMap,
      envMap: envMap,
      envMapIntensity: 0.2, // Lower for walls
      // Default PBR values
      roughness: 0.85,
      metalness: 0.0,
      // Preserve other properties
      side: basicMaterial.side,
      transparent: basicMaterial.transparent,
      opacity: basicMaterial.opacity,
      depthTest: basicMaterial.depthTest,
      depthWrite: basicMaterial.depthWrite
    })

    return standardMaterial
  }

  /**
   * Apply environment map to a material
   */
  static applyEnvironmentMap(material: THREE.Material, envMap: THREE.Texture): void {
    if (
      material instanceof THREE.MeshStandardMaterial ||
      material instanceof THREE.MeshPhysicalMaterial
    ) {
      material.envMap = envMap
      material.needsUpdate = true
    }
  }

  /**
   * Update material quality settings
   */
  static updateMaterialQuality(
    material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
    renderer: THREE.WebGLRenderer
  ): void {
    // Update texture anisotropy if material has textures
    const textures = [material.map, material.normalMap, material.roughnessMap, material.metalnessMap]

    textures.forEach((texture) => {
      if (texture) {
        this.configureTexture(texture, renderer)
      }
    })

    material.needsUpdate = true
  }
}
