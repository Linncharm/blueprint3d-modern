'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Sidebar } from './Sidebar'
import { ContextMenu } from './ContextMenu'
import { CameraControls } from './CameraControls'
import { MainControls } from './MainControls'
import { FloorplannerControls } from './FloorplannerControls'
import { ItemsList } from './ItemsList'
import { TextureSelector } from './TextureSelector'
import { Settings } from './Settings'
import { ViewToggle } from './ViewToggle'
import { MyFloorplans } from './MyFloorplans'
import { SaveFloorplanDialog } from './SaveFloorplanDialog'
import { getStorageService } from '@src/services/storage'
import DefaultFloorplan from '@src/templates/default.json'
import ExampleFloorplan from '@src/templates/example.json'

import { Blueprint3d } from '@src/blueprint3d'
import { floorplannerModes } from '@src/floorplanner/floorplanner_view'
import { Configuration, configDimUnit } from '@src/core/configuration'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import type { Item } from '@src/items/item'
import type { HalfEdge } from '@src/model/half_edge'
import type { Room } from '@src/model/room'

export interface Blueprint3DAppConfig {
  // Authentication related
  isAuthenticated?: boolean
  onAuthRequired?: () => void
  enableWheelZoom?: boolean | (() => boolean)

  // Sidebar management
  externalSidebarCollapsed?: boolean
  onSidebarToggle?: (collapsed: boolean) => void
}

interface Blueprint3DAppBaseProps {
  config?: Blueprint3DAppConfig
}

export function Blueprint3DAppBase({ config = {} }: Blueprint3DAppBaseProps) {
  const {
    isAuthenticated = true,
    onAuthRequired,
    enableWheelZoom = true,
    externalSidebarCollapsed,
    onSidebarToggle: externalOnSidebarToggle
  } = config

  const t = useTranslations('saveDialog')
  const tItems = useTranslations('items')
  const tFloorplanner = useTranslations('floorplanner')
  const tSidebar = useTranslations('sidebar')
  const tMyFloorplans = useTranslations('myFloorplans')

  const contentRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const floorplannerCanvasRef = useRef<HTMLCanvasElement>(null)
  const blueprint3dRef = useRef<Blueprint3d | null>(null)
  const loadingToastsRef = useRef<Array<{ toastId: string | number; itemName: string }>>([])

  const [activeTab, setActiveTab] = useState<
    'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans'
  >('design')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [floorplannerMode, setFloorplannerMode] = useState<'move' | 'draw' | 'delete'>('move')
  const [textureType, setTextureType] = useState<'floor' | 'wall' | null>(null)
  const [currentTarget, setCurrentTarget] = useState<HalfEdge | Room | null>(null)
  const [itemsLoading, setItemsLoading] = useState(0)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
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
      enableWheelZoom: getWheelZoomEnabled()
    }

    const blueprint3d = new Blueprint3d(opts)
    blueprint3dRef.current = blueprint3d

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

    // Load default floorplan
    blueprint3d.model.loadSerialized(JSON.stringify(ExampleFloorplan))

    return () => {
      // Cleanup if needed
    }
  }, [getWheelZoomEnabled, tItems])

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
  const handleSidebarToggle = useCallback(
    (collapsed: boolean) => {
      // Call external handler if provided
      if (externalOnSidebarToggle) {
        externalOnSidebarToggle(collapsed)
      }
      setIsSidebarCollapsed(collapsed)
    },
    [externalOnSidebarToggle]
  )

  // Sync with external sidebar state if provided
  useEffect(() => {
    if (externalSidebarCollapsed !== undefined) {
      setIsSidebarCollapsed(externalSidebarCollapsed)
    }
  }, [externalSidebarCollapsed])

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

  const handleViewChange = useCallback((mode: '2d' | '3d') => {
    if (!blueprint3dRef.current) return
    blueprint3dRef.current.three.setViewMode(mode)
    setViewMode(mode)
  }, [])

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

  // Generate top-down thumbnail
  const generateTopDownThumbnail = useCallback((): string => {
    if (!blueprint3dRef.current) return ''

    const three = blueprint3dRef.current.three
    const camera = three.camera
    const controls = three.controls

    // Save current camera state
    const savedPosition = camera.position.clone()
    const savedTarget = controls.target.clone()
    const savedRotation = camera.rotation.clone()

    try {
      // Get floorplan dimensions
      const center = blueprint3dRef.current.model.floorplan.getCenter()
      const size = blueprint3dRef.current.model.floorplan.getSize()

      // Calculate distance to fit all rooms in view
      const maxDim = Math.max(size.x, size.z)
      const distance = maxDim * 1.8 // Add margin to ensure everything fits

      // Set camera to top-down view
      controls.target.set(center.x, 0, center.z)
      camera.position.set(center.x, distance, center.z)
      camera.lookAt(controls.target)
      camera.updateProjectionMatrix()
      controls.update()

      // Force render
      three.renderer.clear()
      three.renderer.render(three.scene.getScene(), camera)

      // Capture screenshot and resize to smaller thumbnail
      const sourceCanvas = three.renderer.domElement

      // Create a smaller canvas for thumbnail (max 400px width/height)
      const maxSize = 400
      const aspect = sourceCanvas.width / sourceCanvas.height
      let thumbnailWidth = maxSize
      let thumbnailHeight = maxSize

      if (aspect > 1) {
        thumbnailHeight = maxSize / aspect
      } else {
        thumbnailWidth = maxSize * aspect
      }

      // Create temporary canvas for resizing
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = thumbnailWidth
      tempCanvas.height = thumbnailHeight
      const ctx = tempCanvas.getContext('2d')

      if (ctx) {
        // Draw resized image
        ctx.drawImage(sourceCanvas, 0, 0, thumbnailWidth, thumbnailHeight)
        // Use JPEG with quality 0.6 for better compression
        const thumbnail = tempCanvas.toDataURL('image/jpeg', 0.6)
        return thumbnail
      }

      return sourceCanvas.toDataURL('image/jpeg', 0.6)
    } finally {
      // Restore camera state
      camera.position.copy(savedPosition)
      controls.target.copy(savedTarget)
      camera.rotation.copy(savedRotation)
      camera.updateProjectionMatrix()
      controls.update()

      // Force render to restore view
      three.renderer.clear()
      three.renderer.render(three.scene.getScene(), camera)
    }
  }, [])

  // Open save dialog
  const handleSave = useCallback(() => {
    // Check authentication if required
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired()
      return
    }
    setSaveDialogOpen(true)
  }, [isAuthenticated, onAuthRequired])

  // Save to remote storage via API (default)
  const handleSaveFloorplan = useCallback(
    async (name: string) => {
      if (!blueprint3dRef.current) return

      const toastId = toast.loading(t('saving') || 'Saving floorplan...')

      try {
        const data = blueprint3dRef.current.model.exportSerialized()

        // Generate top-down thumbnail
        const thumbnail = generateTopDownThumbnail()

        // Always use remote storage (API)
        const storage = getStorageService(true)
        await storage.saveFloorplan(name, data, thumbnail)

        toast.success(t('saveSuccess'), { id: toastId })
      } catch (error) {
        console.error('Failed to save floorplan:', error)

        // Handle specific error cases
        if (error instanceof Error) {
          if (error.message === 'QUOTA_EXCEEDED') {
            toast.error(t('quotaError'), { id: toastId })
          } else if (
            error.message.includes('User not logged in') ||
            error.message.includes('not logged in')
          ) {
            toast.error('Please log in to save your floorplan.', { id: toastId })
          } else {
            // Don't show error details to user, just a generic message
            toast.error(t('saveError'), { id: toastId })
          }
        } else {
          toast.error(t('saveError'), { id: toastId })
        }
      }
    },
    [generateTopDownThumbnail, t]
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
      </Sidebar>

      <div ref={contentRef} className="flex-1 relative overflow-hidden">
        {/* Floating Toggle Button (shown when collapsed) */}
        <div className="absolute top-16.5 left-5 ">
          <Button
            onClick={() => handleSidebarToggle(false)}
            size="icon"
            className={cn(
              'gradient-background text-primary-foreground rounded-full shadow-lg transition-all duration-300',
              isSidebarCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
            )}
            aria-label={t('openSidebar')}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        {/* 3D Viewer */}
        <div
          id="viewer"
          ref={viewerRef}
          className="absolute inset-0"
          style={{ display: activeTab === 'design' ? 'block' : 'none' }}
        >
          {activeTab === 'design' && (
            <>
              <MainControls
                onNew={handleNew}
                onSave={handleSave}
                onDownload={handleDownload}
                onLoad={handleLoad}
              />

              <ViewToggle viewMode={viewMode} onViewChange={handleViewChange} />
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

          {/* Loading modal */}
          {itemsLoading > 0 && (
            <div id="loading-modal">
              <h1>{tMyFloorplans('loading')}</h1>
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
          {activeTab === 'floorplan' && (
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
          {activeTab === 'items' && <ItemsList onItemSelect={handleItemSelect} />}
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
              <Settings onUnitChange={handleUnitChange} />
            </div>
          )}
        </div>
      </div>

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
