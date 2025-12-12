'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useI18n } from '../../providers/I18nProvider'
import { Sidebar } from './Sidebar'
import { ContextMenu } from './ContextMenu'
import { BedSizeInput } from './BedSizeInput'
import { CameraControls } from './CameraControls'
import { MainControls } from './MainControls'
import { FloorplannerControls } from './FloorplannerControls'
import { ItemsList } from './ItemsList'
import { TextureSelector } from './TextureSelector'
import { Settings } from './Settings'
import { ViewToggle } from './ViewToggle'
import { MyFloorplans } from './MyFloorplans'
import { SaveFloorplanDialog } from './SaveFloorplanDialog'
import { getStorageService } from '@blueprint3d/services/storage'
import DefaultFloorplan from '@blueprint3d/templates/default.json'

import { Blueprint3d } from '@blueprint3d/blueprint3d'
import { floorplannerModes } from '@blueprint3d/floorplanner/floorplanner_view'
import { Configuration, configDimUnit } from '@blueprint3d/core/configuration'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import type { Item } from '@blueprint3d/items/item'
import type { HalfEdge } from '@blueprint3d/model/half_edge'
import type { Room } from '@blueprint3d/model/room'
import { Blueprint3DMode } from '@blueprint3d/config/modes'

export interface Blueprint3DAppConfig {
  // Authentication related (deprecated - no longer required)
  isAuthenticated?: boolean
  onAuthRequired?: () => void
  enableWheelZoom?: boolean | (() => boolean)

  // Session management for anonymous users
  ensureUserSession?: () => Promise<boolean>

  // Mode: application mode (e.g., 'normal', 'generator', 'wealth-corner')
  mode?: string

  // Blueprint3D instance callback
  onBlueprint3DReady?: (blueprint3d: Blueprint3d) => void

  // Bed size change callback (for generator mode)
  onBedSizeChange?: (width: number, length: number) => void

  // show setting language
  isLanguageOption?: boolean

  // Open 'my-floorplans' tab on initialization
  openMyFloorplans?: boolean

  // Fullscreen state (controlled component)
  isFullscreen?: boolean
  onFullscreenToggle?: () => void

  // View mode callback
  onViewModeChange?: (mode: '2d' | '3d') => void

  // Render additional overlay content in the 3D viewer area
  renderOverlay?: () => React.ReactNode

  // Enable continuous rotation even after user interaction
  alwaysSpin?: boolean
}

interface Blueprint3DAppBaseProps {
  config?: Blueprint3DAppConfig
}

export function Blueprint3DAppBase({ config = {} }: Blueprint3DAppBaseProps) {
  const {
    // isAuthenticated = true, // Deprecated, kept for backward compatibility
    // onAuthRequired,
    enableWheelZoom = true,
    ensureUserSession,
    mode = Blueprint3DMode.NORMAL,
    onBlueprint3DReady,
    onBedSizeChange,
    isLanguageOption = true,
    openMyFloorplans = false,
    isFullscreen = false,
    onFullscreenToggle,
    onViewModeChange,
    renderOverlay,
    alwaysSpin = false
  } = config

  const i18n = useI18n()
  const t = i18n.createT('saveDialog')
  const tItems = i18n.createT('items')
  const tFloorplanner = i18n.createT('floorplanner')
  const tSidebar = i18n.createT('sidebar')
  const tMyFloorplans = i18n.createT('myFloorplans')

  const contentRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const floorplannerCanvasRef = useRef<HTMLCanvasElement>(null)
  const blueprint3dRef = useRef<Blueprint3d | null>(null)
  const loadingToastsRef = useRef<Array<{ toastId: string | number; itemName: string }>>([])

  const [activeTab, setActiveTab] = useState<
    'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans'
  >(openMyFloorplans ? 'my-floorplans' : 'design')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [floorplannerMode, setFloorplannerMode] = useState<'move' | 'draw' | 'delete'>('move')
  const [textureType, setTextureType] = useState<'floor' | 'wall' | null>(null)
  const [currentTarget, setCurrentTarget] = useState<HalfEdge | Room | null>(null)
  const [itemsLoading, setItemsLoading] = useState(0)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  // Get effective wheel zoom setting
  const getWheelZoomEnabled = useCallback(() => {
    if (typeof enableWheelZoom === 'function') {
      return enableWheelZoom()
    }
    return enableWheelZoom
  }, [enableWheelZoom])

  // Initialize Blueprint3d
  useEffect(() => {
    if (!viewerRef.current || blueprint3dRef.current) return

    // Load saved dimension unit from localStorage
    const savedUnit = localStorage.getItem('dimensionUnit')
    if (savedUnit) {
      Configuration.setValue(configDimUnit, savedUnit)
    }

    const opts = {
      floorplannerElement: 'floorplanner-canvas',
      threeElement: '#viewer',
      textureDir: '/models/textures/',
      widget: false,
      enableWheelZoom: getWheelZoomEnabled(),
      alwaysSpin
    }

    const blueprint3d = new Blueprint3d(opts)
    blueprint3dRef.current = blueprint3d

    // Notify parent component that blueprint3d is ready
    if (onBlueprint3DReady) {
      onBlueprint3DReady(blueprint3d)
    }

    // Setup callbacks
    blueprint3d.three.itemSelectedCallbacks.add((item) => {
      setSelectedItem(item)
      setTextureType(null)
    })

    blueprint3d.three.itemUnselectedCallbacks.add(() => {
      setSelectedItem(null)
    })

    blueprint3d.three.wallClicked.add((halfEdge) => {
      setCurrentTarget(halfEdge)
      setTextureType('wall')
      setSelectedItem(null)
    })

    blueprint3d.three.floorClicked.add((room) => {
      setCurrentTarget(room)
      setTextureType('floor')
      setSelectedItem(null)
    })

    blueprint3d.three.nothingClicked.add(() => {
      setTextureType(null)
      setCurrentTarget(null)
    })

    blueprint3d.model.scene.itemLoadingCallbacks.add(() => {
      setItemsLoading((prev) => prev + 1)
    })

    blueprint3d.model.scene.itemLoadedCallbacks.add((item) => {
      setItemsLoading((prev) => prev - 1)

      // Update toast to success
      const loadingToasts = loadingToastsRef.current
      if (loadingToasts.length > 0) {
        const { toastId, itemName } = loadingToasts.shift()!
        toast.success(tItems('loadedSuccess', { name: itemName }), { id: toastId })
      }
    })

    blueprint3d.model.scene.itemLoadErrorCallbacks.add(() => {
      setItemsLoading((prev) => prev - 1)

      // Update toast to error
      const loadingToasts = loadingToastsRef.current
      if (loadingToasts.length > 0) {
        const { toastId, itemName } = loadingToasts.shift()!
        toast.error(tItems('loadError', { name: itemName }), { id: toastId })
      }
    })

    // Load floorplan from IndexedDB or use default
    const loadInitialFloorplan = async () => {
      try {
        // Try to load template from IndexedDB first (for all modes)
        const { blueprintTemplateDB } = await import('@blueprint3d/indexdb/blueprint-template')
        const savedTemplate = await blueprintTemplateDB.getTemplate()

        if (savedTemplate) {
          console.log('[Blueprint3DAppBase] Loading template from IndexedDB:', savedTemplate)
          blueprint3d.model.loadSerialized(JSON.stringify(savedTemplate))
          return
        }

        // Fallback to mode-specific default template
        const { getModeConfig, parseMode } = await import('@blueprint3d/config/modes')
        const modeConfig = getModeConfig(parseMode(mode))
        blueprint3d.model.loadSerialized(JSON.stringify(modeConfig.defaultTemplate))
      } catch (error) {
        console.error('[Blueprint3DAppBase] Error loading template:', error)
        // Fallback to hardcoded default
        blueprint3d.model.loadSerialized(JSON.stringify(DefaultFloorplan))
      }
    }

    loadInitialFloorplan()

    return () => {
      // Cleanup if needed
    }
  }, [getWheelZoomEnabled, tItems, mode, onBlueprint3DReady])

  // Update wheel zoom setting when it changes
  useEffect(() => {
    if (blueprint3dRef.current) {
      blueprint3dRef.current.three.controls.enableWheelZoom = getWheelZoomEnabled()
    }
  }, [getWheelZoomEnabled])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (blueprint3dRef.current) {
        if (activeTab === 'design') {
          blueprint3dRef.current.three.updateWindowSize()
        } else if (activeTab === 'floorplan') {
          blueprint3dRef.current.floorplanner?.resizeView()
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  // Handle sidebar collapse/expand using ResizeObserver for accurate sizing
  useEffect(() => {
    if (!contentRef.current || !blueprint3dRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (!blueprint3dRef.current) return

      if (activeTab === 'design') {
        blueprint3dRef.current.three.updateWindowSize()
      } else if (activeTab === 'floorplan') {
        blueprint3dRef.current.floorplanner?.resizeView()
      }
    })

    resizeObserver.observe(contentRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [activeTab])

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed)
  }, [])

  // Camera controls
  const handleZoomIn = useCallback(() => {
    if (!blueprint3dRef.current) return
    blueprint3dRef.current.three.controls.dollyIn(1.1)
    blueprint3dRef.current.three.controls.update()
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!blueprint3dRef.current) return
    blueprint3dRef.current.three.controls.dollyOut(1.1)
    blueprint3dRef.current.three.controls.update()
  }, [])

  const handleResetView = useCallback(() => {
    if (!blueprint3dRef.current) return
    blueprint3dRef.current.three.centerCamera()
  }, [])

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!blueprint3dRef.current) return
    const panSpeed = 30
    const controls = blueprint3dRef.current.three.controls

    switch (direction) {
      case 'up':
        controls.panXY(0, panSpeed)
        break
      case 'down':
        controls.panXY(0, -panSpeed)
        break
      case 'left':
        controls.panXY(panSpeed, 0)
        break
      case 'right':
        controls.panXY(-panSpeed, 0)
        break
    }
  }, [])

  const handleViewChange = useCallback(
    (mode: '2d' | '3d') => {
      if (!blueprint3dRef.current) return
      blueprint3dRef.current.three.setViewMode(mode)
      setViewMode(mode)
      onViewModeChange?.(mode)
    },
    [onViewModeChange]
  )

  // Fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    onFullscreenToggle?.()
  }, [onFullscreenToggle])

  // Item controls
  const handleDeleteItem = useCallback(() => {
    if (selectedItem) {
      selectedItem.removeFromScene()
      setSelectedItem(null)
    }
  }, [selectedItem])

  const handleResizeItem = useCallback(
    (height: number, width: number, depth: number) => {
      if (selectedItem) {
        selectedItem.resize(height, width, depth)
      }
    },
    [selectedItem]
  )

  const handleFixedChange = useCallback(
    (fixed: boolean) => {
      if (selectedItem) {
        selectedItem.setFixed(fixed)
      }
    },
    [selectedItem]
  )

  // Main controls
  const handleNew = useCallback(() => {
    if (!blueprint3dRef.current) return
    blueprint3dRef.current.model.loadSerialized(JSON.stringify(DefaultFloorplan))
  }, [])

  // Generate top-down thumbnail with high resolution and 3:2 aspect ratio
  const generateTopDownThumbnail = useCallback((): string => {
    if (!blueprint3dRef.current) return ''

    const three = blueprint3dRef.current.three
    const camera = three.camera
    const controls = three.controls
    const renderer = three.renderer

    // Save current state
    const savedPosition = camera.position.clone()
    const savedTarget = controls.target.clone()
    const savedRotation = camera.rotation.clone()
    const savedAspect = camera.aspect

    // Get current renderer size
    const currentCanvas = renderer.domElement
    const savedWidth = currentCanvas.width
    const savedHeight = currentCanvas.height

    // Target resolution: 1800x1200 (3:2 ratio) for high quality
    const targetWidth = 1800
    const targetHeight = 1200

    try {
      // Temporarily resize renderer to high resolution
      renderer.setSize(targetWidth, targetHeight, false)

      // Update camera aspect ratio to 3:2
      camera.aspect = targetWidth / targetHeight
      camera.updateProjectionMatrix()

      // Get floorplan dimensions
      const center = blueprint3dRef.current.model.floorplan.getCenter()
      const size = blueprint3dRef.current.model.floorplan.getSize()

      // Calculate proper framing for 3:2 aspect ratio with margin
      const targetAspect = 3 / 2
      const roomAspect = size.x / size.z
      const margin = 1.4 // 40% margin around the room for spacing

      let viewWidth: number, viewHeight: number
      if (roomAspect > targetAspect) {
        // Room is wider than target aspect, fit by width
        viewWidth = size.x * margin
        viewHeight = viewWidth / targetAspect
      } else {
        // Room is taller than target aspect, fit by height
        viewHeight = size.z * margin
        viewWidth = viewHeight * targetAspect
      }

      // Calculate camera distance to fit the calculated view
      const fov = camera.fov * (Math.PI / 180)
      const distance = Math.max(viewWidth, viewHeight) / (2 * Math.tan(fov / 2))

      // Set camera to top-down view
      controls.target.set(center.x, 0, center.z)
      camera.position.set(center.x, distance, center.z)
      camera.lookAt(controls.target)
      camera.updateProjectionMatrix()
      controls.update()

      // Render at high resolution
      renderer.clear()
      renderer.render(three.scene.getScene(), camera)

      // Capture as JPEG with good quality (0.85 balances quality and file size)
      const dataURL = currentCanvas.toDataURL('image/webp', 0.85)

      return dataURL
    } finally {
      // Restore renderer size
      renderer.setSize(savedWidth, savedHeight, false)

      // Restore camera state
      camera.aspect = savedAspect
      camera.position.copy(savedPosition)
      controls.target.copy(savedTarget)
      camera.rotation.copy(savedRotation)
      camera.updateProjectionMatrix()
      controls.update()

      // Force render to restore view
      renderer.clear()
      renderer.render(three.scene.getScene(), camera)
    }
  }, [])

  // Open save dialog (no longer requires authentication check)
  const handleSave = useCallback(() => {
    setSaveDialogOpen(true)
  }, [])

  // Save to remote storage via API (supports anonymous users)
  const handleSaveFloorplan = useCallback(
    async (name: string) => {
      if (!blueprint3dRef.current) return

      const toastId = toast.loading(t('saving') || 'Saving floorplan...')

      try {
        const data = blueprint3dRef.current.model.exportSerialized()

        // Generate top-down thumbnail
        const thumbnail = generateTopDownThumbnail()

        // Always use remote storage (API) with session management
        const storage = getStorageService(true, ensureUserSession)
        await storage.saveFloorplan(name, data, thumbnail)

        toast.success(t('saveSuccess'), { id: toastId })
      } catch (error) {
        console.error('Failed to save floorplan:', error)

        // Handle specific error cases
        if (error instanceof Error) {
          if (error.message === 'QUOTA_EXCEEDED') {
            toast.error(t('quotaError'), { id: toastId })
          } else if (error.message.includes('Failed to establish user session')) {
            toast.error('Failed to create session. Please try again.', { id: toastId })
          } else if (
            error.message.includes('User not logged in') ||
            error.message.includes('not logged in')
          ) {
            // This shouldn't happen with anonymous login, but keep as fallback
            toast.error('Session error. Please refresh and try again.', { id: toastId })
          } else {
            // Don't show error details to user, just a generic message
            toast.error(t('saveError'), { id: toastId })
          }
        } else {
          toast.error(t('saveError'), { id: toastId })
        }
      }
    },
    [generateTopDownThumbnail, t, ensureUserSession]
  )

  // Download as file
  const handleDownload = useCallback(() => {
    if (!blueprint3dRef.current) return
    const data = blueprint3dRef.current.model.exportSerialized()
    const blob = new Blob([data], { type: 'text' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'design.lumenfeng'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  // Load from file
  const handleLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!blueprint3dRef.current) return
    const files = event.target.files
    if (!files || files.length === 0) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      if (typeof data === 'string' && blueprint3dRef.current) {
        blueprint3dRef.current.model.loadSerialized(data)
      }
    }
    reader.readAsText(files[0])
  }, [])

  // Load from saved floorplan
  const handleLoadFloorplan = useCallback((data: string) => {
    if (!blueprint3dRef.current) return
    blueprint3dRef.current.model.loadSerialized(data)
    setActiveTab('design')
  }, [])

  // Handle unit change
  const handleUnitChange = useCallback(
    (unit: string) => {
      Configuration.setValue(configDimUnit, unit)
      // Force floorplanner to redraw with new units
      if (blueprint3dRef.current && activeTab === 'floorplan') {
        blueprint3dRef.current.floorplanner?.reset()
      }
    },
    [activeTab]
  )

  // Tab change
  const handleTabChange = useCallback(
    (tab: 'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans') => {
      setActiveTab(tab)
      setTextureType(null)

      if (blueprint3dRef.current) {
        blueprint3dRef.current.three.stopSpin()
        blueprint3dRef.current.three.getController().setSelectedObject(null)

        if (tab === 'floorplan') {
          // Use requestAnimationFrame to ensure DOM has updated before centering
          requestAnimationFrame(() => {
            if (blueprint3dRef.current) {
              blueprint3dRef.current.floorplanner?.reset()
              // Additional frame to ensure canvas size is correct
              requestAnimationFrame(() => {
                if (blueprint3dRef.current) {
                  blueprint3dRef.current.floorplanner?.resetOrigin()
                }
              })
            }
          })
        } else if (tab === 'design') {
          blueprint3dRef.current.model.floorplan.update()
          setTimeout(() => {
            if (blueprint3dRef.current) {
              blueprint3dRef.current.three.updateWindowSize()
            }
          }, 100)
        }
      }
    },
    []
  )

  // Floorplanner controls
  const handleFloorplannerModeChange = useCallback((mode: 'move' | 'draw' | 'delete') => {
    setFloorplannerMode(mode)
    if (!blueprint3dRef.current) return

    const modeMap = {
      move: floorplannerModes.MOVE,
      draw: floorplannerModes.DRAW,
      delete: floorplannerModes.DELETE
    }
    blueprint3dRef.current.floorplanner?.setMode(modeMap[mode])
  }, [])

  const handleFloorplannerDone = useCallback(() => {
    setActiveTab('design')
    if (blueprint3dRef.current) {
      blueprint3dRef.current.model.floorplan.update()
    }
  }, [])

  // Item selection
  const handleItemSelect = useCallback(
    (item: { name: string; model: string; type: string }) => {
      if (!blueprint3dRef.current) return

      // Show loading toast
      const toastId = toast.loading(tItems('loadingItem', { name: item.name }))
      loadingToastsRef.current.push({ toastId, itemName: item.name })

      const metadata = {
        itemName: item.name,
        resizable: true,
        modelUrl: item.model,
        itemType: parseInt(item.type)
      }

      blueprint3dRef.current.model.scene.addItem(parseInt(item.type), item.model, metadata)
      setActiveTab('design')
    },
    [tItems]
  )

  // Texture selection
  const handleTextureSelect = useCallback(
    (textureUrl: string, stretch: boolean, scale: number) => {
      if (currentTarget) {
        currentTarget.setTexture(textureUrl, stretch, scale)
      }
    },
    [currentTarget]
  )

  return (
    <div className="flex h-full w-full">
      <div ref={contentRef} className="flex-1 relative overflow-hidden">
        {/* Floating Toggle Button (shown when collapsed and not fullscreen) */}
        {!isFullscreen && (
          <div className="absolute top-16.5 right-5 ">
            <Button
              onClick={() => handleSidebarToggle(false)}
              size="icon"
              className={cn(
                'gradient-background text-primary-foreground rounded-full shadow-lg transition-all duration-300',
                isSidebarCollapsed
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-0 pointer-events-none'
              )}
              aria-label={t('openSidebar')}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        )}
        {/* 3D Viewer */}
        <div
          id="viewer"
          ref={viewerRef}
          className="absolute inset-0"
          style={{ display: activeTab === 'design' ? 'block' : 'none' }}
        >
          {activeTab === 'design' && (
            <>
              {!isFullscreen && (
                <>
                  <MainControls
                    onNew={handleNew}
                    onSave={handleSave}
                    onDownload={handleDownload}
                    onLoad={handleLoad}
                  />
                  <CameraControls
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetView={handleResetView}
                    onMoveLeft={() => handleMove('left')}
                    onMoveRight={() => handleMove('right')}
                    onMoveUp={() => handleMove('up')}
                    onMoveDown={() => handleMove('down')}
                  />
                </>
              )}
              <ViewToggle
                viewMode={viewMode}
                onViewChange={handleViewChange}
                isFullscreen={isFullscreen}
                onFullscreenToggle={handleFullscreenToggle}
              />
              {/* Render custom overlay content */}
              {renderOverlay && renderOverlay()}
            </>
          )}

          {/* Loading modal */}
          {itemsLoading > 0 && (
            <div id="loading-modal">
              <div className="loading-content">
                <p>
                  {tMyFloorplans('loading')}
                  <span className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2D Floorplanner */}
        <div
          id="floorplanner"
          className="absolute inset-0"
          style={{ display: activeTab === 'floorplan' ? 'block' : 'none' }}
        >
          <canvas id="floorplanner-canvas" ref={floorplannerCanvasRef}></canvas>
          {activeTab === 'floorplan' && !isFullscreen && (
            <>
              <FloorplannerControls
                mode={floorplannerMode}
                onModeChange={handleFloorplannerModeChange}
                onDone={handleFloorplannerDone}
              />
              {floorplannerMode === 'draw' && (
                <div className="absolute left-5 bottom-5 bg-black/50 text-primary-foreground px-2.5 py-1.5 rounded text-sm">
                  {tFloorplanner('escHint')}
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Items */}
        <div
          id="add-items"
          className="w-full h-full overflow-y-auto p-5"
          style={{ display: activeTab === 'items' ? 'block' : 'none' }}
        >
          {activeTab === 'items' && <ItemsList onItemSelect={handleItemSelect} mode={mode as any} />}
        </div>

        {/* My Floorplans */}
        <div
          id="my-floorplans"
          className="w-full h-full overflow-y-auto p-5 bg-card"
          style={{ display: activeTab === 'my-floorplans' ? 'block' : 'none' }}
        >
          {activeTab === 'my-floorplans' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {tSidebar('myFloorplans')}
              </h2>
              <MyFloorplans onLoadFloorplan={handleLoadFloorplan} />
            </div>
          )}
        </div>

        {/* Settings */}
        <div
          id="settings"
          className="w-full h-full overflow-y-auto p-10 bg-card"
          style={{ display: activeTab === 'settings' ? 'block' : 'none' }}
        >
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <Settings onUnitChange={handleUnitChange} isLanguageOption={isLanguageOption} />
            </div>
          )}
        </div>
      </div>

      {!isFullscreen && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
        >
          {selectedItem && !textureType && (
            <ContextMenu
              selectedItem={selectedItem}
              onDelete={handleDeleteItem}
              onResize={handleResizeItem}
              onFixedChange={handleFixedChange}
            />
          )}
          {textureType && (
            <TextureSelector type={textureType} onTextureSelect={handleTextureSelect} />
          )}
          {mode === 'generator' && !selectedItem && !textureType && onBedSizeChange && (
            <BedSizeInput onSizeChange={onBedSizeChange} />
          )}
        </Sidebar>
      )}

      {/* Save Floorplan Dialog */}
      <SaveFloorplanDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveFloorplan}
        defaultName={`Floorplan ${new Date().toLocaleDateString()}`}
      />
    </div>
  )
}
