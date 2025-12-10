import * as THREE from 'three'

export enum QualityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export interface QualitySettings {
  shadowMapSize: number
  shadowMapType: THREE.ShadowMapType
  enablePostProcessing: boolean
  enableSSAO: boolean
  enableBloom: boolean
  enableSMAA: boolean
  pixelRatio: number
  maxLights: number
  enableEnvironmentMap: boolean
  anisotropy: number
}

export class QualityManager {
  private static currentLevel: QualityLevel = QualityLevel.HIGH
  private static isManualOverride: boolean = false
  private static frameCount = 0
  private static lastTime = 0
  private static monitoringActive = false

  // 质量配置表
  private static readonly QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
    [QualityLevel.ULTRA]: {
      shadowMapSize: 4096,
      shadowMapType: THREE.PCFSoftShadowMap,
      enablePostProcessing: true,
      enableSSAO: true,
      enableBloom: true,
      enableSMAA: true,
      pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
      maxLights: 4,
      enableEnvironmentMap: true,
      anisotropy: 16
    },
    [QualityLevel.HIGH]: {
      shadowMapSize: 2048,
      shadowMapType: THREE.PCFSoftShadowMap,
      enablePostProcessing: true,
      enableSSAO: true,
      enableBloom: true,
      enableSMAA: true,
      pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
      maxLights: 3,
      enableEnvironmentMap: true,
      anisotropy: 8
    },
    [QualityLevel.MEDIUM]: {
      shadowMapSize: 1024,
      shadowMapType: THREE.PCFShadowMap,
      enablePostProcessing: true,
      enableSSAO: false,
      enableBloom: true,
      enableSMAA: false, // 使用 WebGL 原生抗锯齿
      pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5),
      maxLights: 2,
      enableEnvironmentMap: false,
      anisotropy: 4
    },
    [QualityLevel.LOW]: {
      shadowMapSize: 512,
      shadowMapType: THREE.PCFShadowMap,
      enablePostProcessing: false,
      enableSSAO: false,
      enableBloom: false,
      enableSMAA: false,
      pixelRatio: 1,
      maxLights: 2,
      enableEnvironmentMap: false,
      anisotropy: 1
    }
  }

  /**
   * 检测设备的最佳质量等级
   */
  static detectOptimalQuality(): QualityLevel {
    if (typeof window === 'undefined') {
      return QualityLevel.MEDIUM
    }

    try {
      // 检测 GPU 性能
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')

      if (!gl) return QualityLevel.LOW

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''

      // 移动设备检测
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

      // GPU 层级判断
      const isHighEndGPU =
        /NVIDIA|AMD|Apple M[1-3]|Mali-G7[0-9]|Mali-G[8-9][0-9]|Adreno [6-7][0-9][0-9]/i.test(renderer)
      const isLowEndGPU = /Intel.*HD [0-5][0-9][0-9][0-9]|Mali-4|Adreno [2-4][0-9][0-9]/i.test(renderer)

      // 决策逻辑
      if (isMobile) {
        return isHighEndGPU ? QualityLevel.MEDIUM : QualityLevel.LOW
      } else {
        if (isLowEndGPU) return QualityLevel.MEDIUM
        if (isHighEndGPU) return QualityLevel.ULTRA
        return QualityLevel.HIGH
      }
    } catch (error) {
      console.warn('[QualityManager] Failed to detect GPU, defaulting to MEDIUM', error)
      return QualityLevel.MEDIUM
    }
  }

  /**
   * 初始化质量管理器
   */
  static initialize(): void {
    if (!this.isManualOverride) {
      this.currentLevel = this.detectOptimalQuality()
    }
    console.log(`[QualityManager] Quality level: ${this.currentLevel}`)
  }

  /**
   * 手动设置质量等级（用户覆盖）
   */
  static setQuality(level: QualityLevel): void {
    if (this.currentLevel === level) return

    this.currentLevel = level
    this.isManualOverride = true

    // 触发渲染器重新配置
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quality-changed', { detail: level }))
    }

    console.log(`[QualityManager] Quality manually set to: ${level}`)
  }

  /**
   * 启用自动质量调整
   */
  static enableAutoQuality(): void {
    this.isManualOverride = false
    console.log('[QualityManager] Auto quality adjustment enabled')
  }

  /**
   * 获取当前质量等级
   */
  static getCurrentLevel(): QualityLevel {
    return this.currentLevel
  }

  /**
   * 获取当前质量设置
   */
  static getCurrentSettings(): QualitySettings {
    return this.QUALITY_PRESETS[this.currentLevel]
  }

  /**
   * 获取阴影贴图大小
   */
  static getShadowMapSize(): number {
    return this.getCurrentSettings().shadowMapSize
  }

  /**
   * 获取阴影贴图类型
   */
  static getShadowMapType(): THREE.ShadowMapType {
    return this.getCurrentSettings().shadowMapType
  }

  /**
   * 是否启用后处理
   */
  static isPostProcessingEnabled(): boolean {
    return this.getCurrentSettings().enablePostProcessing
  }

  /**
   * 是否启用 SSAO
   */
  static isSSAOEnabled(): boolean {
    return this.getCurrentSettings().enableSSAO
  }

  /**
   * 是否启用 Bloom
   */
  static isBloomEnabled(): boolean {
    return this.getCurrentSettings().enableBloom
  }

  /**
   * 是否启用 SMAA
   */
  static isSMAAEnabled(): boolean {
    return this.getCurrentSettings().enableSMAA
  }

  /**
   * 是否启用环境贴图
   */
  static isEnvironmentMapEnabled(): boolean {
    return this.getCurrentSettings().enableEnvironmentMap
  }

  /**
   * 获取像素比
   */
  static getPixelRatio(): number {
    return this.getCurrentSettings().pixelRatio
  }

  /**
   * 获取最大光源数量
   */
  static getMaxLights(): number {
    return this.getCurrentSettings().maxLights
  }

  /**
   * 获取各向异性过滤级别
   */
  static getAnisotropy(): number {
    return this.getCurrentSettings().anisotropy
  }

  /**
   * 开始性能监控
   */
  static startPerformanceMonitoring(): void {
    if (this.monitoringActive || typeof window === 'undefined') return

    this.monitoringActive = true
    this.frameCount = 0
    this.lastTime = performance.now()

    const monitor = () => {
      if (!this.monitoringActive) return

      this.frameCount++
      const now = performance.now()

      // 每秒检查一次
      if (now - this.lastTime >= 1000) {
        const fps = this.frameCount
        this.frameCount = 0
        this.lastTime = now

        // 动态降级/升级（仅在自动模式下）
        if (!this.isManualOverride) {
          if (fps < 30 && this.currentLevel !== QualityLevel.LOW) {
            console.warn(`[QualityManager] Low FPS (${fps}), downgrading quality`)
            this.downgradeQuality()
          } else if (fps > 55 && this.currentLevel !== QualityLevel.ULTRA) {
            // 可以选择性升级（需要连续多次高 FPS 才升级，避免频繁切换）
            // 暂时禁用自动升级，避免不稳定
          }
        }
      }

      requestAnimationFrame(monitor)
    }

    requestAnimationFrame(monitor)
  }

  /**
   * 停止性能监控
   */
  static stopPerformanceMonitoring(): void {
    this.monitoringActive = false
  }

  /**
   * 降低质量等级
   */
  private static downgradeQuality(): void {
    const levels = [QualityLevel.ULTRA, QualityLevel.HIGH, QualityLevel.MEDIUM, QualityLevel.LOW]
    const currentIndex = levels.indexOf(this.currentLevel)

    if (currentIndex < levels.length - 1) {
      this.currentLevel = levels[currentIndex + 1]

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('quality-changed', { detail: this.currentLevel }))
      }

      console.log(`[QualityManager] Quality downgraded to: ${this.currentLevel}`)
    }
  }

  /**
   * 提升质量等级
   */
  private static upgradeQuality(): void {
    const levels = [QualityLevel.ULTRA, QualityLevel.HIGH, QualityLevel.MEDIUM, QualityLevel.LOW]
    const currentIndex = levels.indexOf(this.currentLevel)

    if (currentIndex > 0) {
      this.currentLevel = levels[currentIndex - 1]

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('quality-changed', { detail: this.currentLevel }))
      }

      console.log(`[QualityManager] Quality upgraded to: ${this.currentLevel}`)
    }
  }

  /**
   * 获取质量描述（用于 UI 显示）
   */
  static getQualityDescription(level: QualityLevel): string {
    const descriptions = {
      [QualityLevel.LOW]: '低质量 - 适合低端移动设备',
      [QualityLevel.MEDIUM]: '中等质量 - 适合平板和中端设备',
      [QualityLevel.HIGH]: '高质量 - 适合桌面电脑',
      [QualityLevel.ULTRA]: '超高质量 - 适合高端游戏电脑'
    }
    return descriptions[level]
  }
}
