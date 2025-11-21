'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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
import { getStorageService } from '@/services/storage'
import DefaultFloorplan from '@/public/constants/default.json'
import ExampleFloorplan from '@/public/constants/example.json'

// @ts-ignore
import { Blueprint3d } from '@src/blueprint3d'
// @ts-ignore
import { floorplannerModes } from '@src/floorplanner/floorplanner_view'
// @ts-ignore
import { Configuration, configDimUnit } from '@src/core/configuration'

export function Blueprint3DApp() {
  const viewerRef = useRef<HTMLDivElement>(null)
  const floorplannerCanvasRef = useRef<HTMLCanvasElement>(null)
  const blueprint3dRef = useRef<any>(null)

  const [activeTab, setActiveTab] = useState<'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans'>('design')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [floorplannerMode, setFloorplannerMode] = useState<'move' | 'draw' | 'delete'>('move')
  const [textureType, setTextureType] = useState<'floor' | 'wall' | null>(null)
  const [currentTarget, setCurrentTarget] = useState<any>(null)
  const [itemsLoading, setItemsLoading] = useState(0)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
    }

    const blueprint3d = new Blueprint3d(opts)
    blueprint3dRef.current = blueprint3d

    // Setup callbacks
    blueprint3d.three.itemSelectedCallbacks.add((item: any) => {
      setSelectedItem(item)
      setTextureType(null)
    })

    blueprint3d.three.itemUnselectedCallbacks.add(() => {
      setSelectedItem(null)
    })

    blueprint3d.three.wallClicked.add((halfEdge: any) => {
      setCurrentTarget(halfEdge)
      setTextureType('wall')
      setSelectedItem(null)
    })

    blueprint3d.three.floorClicked.add((room: any) => {
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

    blueprint3d.model.scene.itemLoadedCallbacks.add(() => {
      setItemsLoading((prev) => prev - 1)
    })

    // Load default floorplan
    blueprint3d.model.loadSerialized(JSON.stringify(ExampleFloorplan))

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (blueprint3dRef.current) {
        if (activeTab === 'design') {
          blueprint3dRef.current.three.updateWindowSize()
        } else if (activeTab === 'floorplan') {
          blueprint3dRef.current.floorplanner.resizeView()
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  // Handle sidebar collapse/expand
  useEffect(() => {
    if (!blueprint3dRef.current) return

    // Wait for the transition to complete (300ms) before resizing
    const timeoutId = setTimeout(() => {
      if (activeTab === 'design') {
        blueprint3dRef.current.three.updateWindowSize()
      } else if (activeTab === 'floorplan') {
        blueprint3dRef.current.floorplanner.resizeView()
      }
    }, 350) // Slightly longer than the 300ms transition

    return () => clearTimeout(timeoutId)
  }, [isSidebarCollapsed, activeTab])

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

  const handleViewChange = useCallback((mode: '2d' | '3d') => {
    if (!blueprint3dRef.current) return
    blueprint3dRef.current.three.setViewMode(mode)
    setViewMode(mode)
  }, [])

  // Item controls
  const handleDeleteItem = useCallback(() => {
    if (selectedItem) {
      selectedItem.remove()
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

  // Save to browser storage
  const handleSave = useCallback(async () => {
    if (!blueprint3dRef.current) return

    const name = prompt('Enter a name for your floorplan:', `Floorplan ${new Date().toLocaleDateString()}`)
    if (!name) return

    try {
      const data = blueprint3dRef.current.model.exportSerialized()

      // Generate a simple thumbnail (optional - can be improved later)
      const canvas = blueprint3dRef.current.three.renderer.domElement
      const thumbnail = canvas.toDataURL('image/png', 0.5)

      const storage = getStorageService()
      await storage.saveFloorplan(name, data, thumbnail)

      alert('Floorplan saved successfully!')
    } catch (error) {
      console.error('Failed to save floorplan:', error)
      alert('Failed to save floorplan. Please try again.')
    }
  }, [])

  // Download as file
  const handleDownload = useCallback(() => {
    if (!blueprint3dRef.current) return
    const data = blueprint3dRef.current.model.exportSerialized()
    const blob = new Blob([data], { type: 'text' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'design.blueprint3d'
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
      if (typeof data === 'string') {
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
  const handleUnitChange = useCallback((unit: string) => {
    Configuration.setValue(configDimUnit, unit)
    // Force floorplanner to redraw with new units
    if (blueprint3dRef.current && activeTab === 'floorplan') {
      blueprint3dRef.current.floorplanner.reset()
    }
  }, [activeTab])

  // Tab change
  const handleTabChange = useCallback((tab: 'floorplan' | 'design' | 'items' | 'settings' | 'my-floorplans') => {
    setActiveTab(tab)
    setTextureType(null)

    if (blueprint3dRef.current) {
      blueprint3dRef.current.three.stopSpin()
      blueprint3dRef.current.three.getController().setSelectedObject(null)

      if (tab === 'floorplan') {
        // Use requestAnimationFrame to ensure DOM has updated before centering
        requestAnimationFrame(() => {
          if (blueprint3dRef.current) {
            blueprint3dRef.current.floorplanner.reset()
            // Additional frame to ensure canvas size is correct
            requestAnimationFrame(() => {
              if (blueprint3dRef.current) {
                blueprint3dRef.current.floorplanner.resetOrigin()
              }
            })
          }
        })
      } else if (tab === 'design') {
        blueprint3dRef.current.model.floorplan.update()
        setTimeout(() => {
          blueprint3dRef.current.three.updateWindowSize()
        }, 100)
      }
    }
  }, [])

  // Floorplanner controls
  const handleFloorplannerModeChange = useCallback((mode: 'move' | 'draw' | 'delete') => {
    setFloorplannerMode(mode)
    if (!blueprint3dRef.current) return

    const modeMap = {
      move: floorplannerModes.MOVE,
      draw: floorplannerModes.DRAW,
      delete: floorplannerModes.DELETE,
    }
    blueprint3dRef.current.floorplanner.setMode(modeMap[mode])
  }, [])

  const handleFloorplannerDone = useCallback(() => {
    setActiveTab('design')
    if (blueprint3dRef.current) {
      blueprint3dRef.current.model.floorplan.update()
    }
  }, [])

  // Item selection
  const handleItemSelect = useCallback((item: { name: string; model: string; type: string }) => {
    if (!blueprint3dRef.current) return

    const metadata = {
      itemName: item.name,
      resizable: true,
      modelUrl: item.model,
      itemType: parseInt(item.type),
    }

    blueprint3dRef.current.model.scene.addItem(
      parseInt(item.type),
      item.model,
      metadata
    )
    setActiveTab('design')
  }, [])

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
    <div className="flex h-screen overflow-hidden">
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

      <div className="flex-1 relative">
        {/* 3D Viewer */}
        <div
          id="viewer"
          ref={viewerRef}
          className="w-full h-full"
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
              <h1>Loading...</h1>
            </div>
          )}
        </div>

        {/* 2D Floorplanner */}
        <div
          id="floorplanner"
          className="w-full h-full relative"
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
                <div className="absolute left-5 bottom-5 bg-black/50 text-white px-2.5 py-1.5 rounded text-sm">
                  Press the &quot;Esc&quot; key to stop drawing walls
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
          className="w-full h-full overflow-y-auto p-5 bg-gray-50"
          style={{ display: activeTab === 'my-floorplans' ? 'block' : 'none' }}
        >
          {activeTab === 'my-floorplans' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Floorplans</h2>
              <MyFloorplans onLoadFloorplan={handleLoadFloorplan} />
            </div>
          )}
        </div>

        {/* Settings */}
        <div
          id="settings"
          className="w-full h-full overflow-y-auto p-10 bg-gray-50"
          style={{ display: activeTab === 'settings' ? 'block' : 'none' }}
        >
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
              <Settings onUnitChange={handleUnitChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
