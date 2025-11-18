import * as THREE from 'three'
import { Blueprint3d } from '../../src/blueprint3d'
import { floorplannerModes } from '../../src/floorplanner/floorplanner_view'
import { EventEmitter } from '../../src/core/events'
import DefaultFloorplan from '../constants/default.json'
import RichFloorplan from '../constants/example.json'

// Helper functions to replace jQuery
const $ = (selector) => {
  if (selector instanceof HTMLElement) return selector
  return document.querySelector(selector)
}

const $$ = (selector) => document.querySelectorAll(selector)

const addClass = (el, className) => {
  if (!el) return
  const classes = className.split(' ').filter((c) => c)
  el.classList.add(...classes)
}

const removeClass = (el, className) => {
  if (!el) return
  const classes = className.split(' ').filter((c) => c)
  el.classList.remove(...classes)
}

const hasClass = (el, className) => el?.classList.contains(className)

/*
 * Camera Buttons
 */

class CameraButtons {
  constructor(blueprint3d) {
    this.blueprint3d = blueprint3d
    this.orbitControls = blueprint3d.three.controls
    this.three = blueprint3d.three
    this.panSpeed = 30
    this.directions = {
      UP: 1,
      DOWN: 2,
      LEFT: 3,
      RIGHT: 4
    }
    this.init()
  }

  init() {
    $('#zoom-in').addEventListener('click', (e) => this.zoomIn(e))
    $('#zoom-out').addEventListener('click', (e) => this.zoomOut(e))
    $('#zoom-in').addEventListener('dblclick', this.preventDefault)
    $('#zoom-out').addEventListener('dblclick', this.preventDefault)

    $('#reset-view').addEventListener('click', () => this.three.centerCamera())

    $('#move-left').addEventListener('click', () => this.pan(this.directions.LEFT))
    $('#move-right').addEventListener('click', () => this.pan(this.directions.RIGHT))
    $('#move-up').addEventListener('click', () => this.pan(this.directions.UP))
    $('#move-down').addEventListener('click', () => this.pan(this.directions.DOWN))

    $('#move-left').addEventListener('dblclick', this.preventDefault)
    $('#move-right').addEventListener('dblclick', this.preventDefault)
    $('#move-up').addEventListener('dblclick', this.preventDefault)
    $('#move-down').addEventListener('dblclick', this.preventDefault)
  }

  preventDefault(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  pan(direction) {
    switch (direction) {
      case this.directions.UP:
        this.orbitControls.panXY(0, this.panSpeed)
        break
      case this.directions.DOWN:
        this.orbitControls.panXY(0, -this.panSpeed)
        break
      case this.directions.LEFT:
        this.orbitControls.panXY(this.panSpeed, 0)
        break
      case this.directions.RIGHT:
        this.orbitControls.panXY(-this.panSpeed, 0)
        break
    }
  }

  zoomIn(e) {
    e.preventDefault()
    this.orbitControls.dollyIn(1.1)
    this.orbitControls.update()
  }

  zoomOut(e) {
    e.preventDefault()
    this.orbitControls.dollyOut(1.1)
    this.orbitControls.update()
  }
}

/*
 * Context menu for selected item
 */

class ContextMenu {
  constructor(blueprint3d) {
    this.blueprint3d = blueprint3d
    this.selectedItem = null
    this.three = blueprint3d.three
    this.init()
  }

  init() {
    $('#context-menu-delete').addEventListener('click', () => {
      if (this.selectedItem) {
        this.selectedItem.remove()
      }
    })

    this.three.itemSelectedCallbacks.add((item) => this.itemSelected(item))
    this.three.itemUnselectedCallbacks.add(() => this.itemUnselected())

    this.initResize()

    $('#fixed').addEventListener('click', () => {
      const checked = $('#fixed').checked
      if (this.selectedItem) {
        this.selectedItem.setFixed(checked)
      }
    })
  }

  cmToIn(cm) {
    return cm / 2.54
  }

  inToCm(inches) {
    return inches * 2.54
  }

  itemSelected(item) {
    this.selectedItem = item

    $('#context-menu-name').textContent = item.metadata.itemName

    $('#item-width').value = this.cmToIn(this.selectedItem.getWidth()).toFixed(0)
    $('#item-height').value = this.cmToIn(this.selectedItem.getHeight()).toFixed(0)
    $('#item-depth').value = this.cmToIn(this.selectedItem.getDepth()).toFixed(0)

    $('#context-menu').style.display = 'block'

    $('#fixed').checked = item.fixed
  }

  resize() {
    if (this.selectedItem) {
      this.selectedItem.resize(
        this.inToCm($('#item-height').value),
        this.inToCm($('#item-width').value),
        this.inToCm($('#item-depth').value)
      )
    }
  }

  initResize() {
    $('#item-height').addEventListener('change', () => this.resize())
    $('#item-width').addEventListener('change', () => this.resize())
    $('#item-depth').addEventListener('change', () => this.resize())
  }

  itemUnselected() {
    this.selectedItem = null
    $('#context-menu').style.display = 'none'
  }
}

/*
 * Loading modal for items
 */

class ModalEffects {
  constructor(blueprint3d) {
    this.blueprint3d = blueprint3d
    this.itemsLoading = 0
    this.init()
  }

  setActiveItem(active) {
    this.itemSelected = active
    this.update()
  }

  update() {
    if (this.itemsLoading > 0) {
      $('#loading-modal').style.display = 'block'
    } else {
      $('#loading-modal').style.display = 'none'
    }
  }

  init() {
    this.blueprint3d.model.scene.itemLoadingCallbacks.add(() => {
      this.itemsLoading += 1
      this.update()
    })

    this.blueprint3d.model.scene.itemLoadedCallbacks.add(() => {
      this.itemsLoading -= 1
      this.update()
    })

    this.update()
  }
}

/*
 * Side menu
 */

class SideMenu {
  constructor(blueprint3d, floorplanControls, modalEffects) {
    this.blueprint3d = blueprint3d
    this.floorplanControls = floorplanControls
    this.modalEffects = modalEffects
    this.ACTIVE_CLASS = 'active'

    this.tabs = {
      FLOORPLAN: $('#floorplan_tab'),
      SHOP: $('#items_tab'),
      DESIGN: $('#design_tab')
    }

    this.stateChangeCallbacks = new EventEmitter()

    this.states = {
      DEFAULT: {
        div: $('#viewer'),
        tab: this.tabs.DESIGN
      },
      FLOORPLAN: {
        div: $('#floorplanner'),
        tab: this.tabs.FLOORPLAN
      },
      SHOP: {
        div: $('#add-items'),
        tab: this.tabs.SHOP
      }
    }

    this.currentState = this.states.FLOORPLAN

    this.init()
  }

  init() {
    for (let tab in this.tabs) {
      const elem = this.tabs[tab]
      elem.addEventListener('click', this.tabClicked(elem))
    }

    $('#update-floorplan').addEventListener('click', () => this.floorplanUpdate())

    this.initLeftMenu()

    this.blueprint3d.three.updateWindowSize()
    this.handleWindowResize()

    this.initItems()

    this.setCurrentState(this.states.DEFAULT)
  }

  floorplanUpdate() {
    this.setCurrentState(this.states.DEFAULT)
  }

  tabClicked(tab) {
    return () => {
      // Stop three from spinning
      this.blueprint3d.three.stopSpin()

      // Selected a new tab
      for (let key in this.states) {
        const state = this.states[key]
        if (state.tab === tab) {
          this.setCurrentState(state)
          break
        }
      }
    }
  }

  setCurrentState(newState) {
    if (this.currentState === newState) {
      return
    }

    // show the right tab as active
    if (this.currentState.tab !== newState.tab) {
      if (this.currentState.tab != null) {
        removeClass(this.currentState.tab, this.ACTIVE_CLASS)
      }
      if (newState.tab != null) {
        addClass(newState.tab, this.ACTIVE_CLASS)
      }
    }

    // set item unselected
    this.blueprint3d.three.getController().setSelectedObject(null)

    // show and hide the right divs
    this.currentState.div.style.display = 'none'
    newState.div.style.display = 'block'

    // custom actions
    if (newState === this.states.FLOORPLAN) {
      this.floorplanControls.updateFloorplanView()
      this.floorplanControls.handleWindowResize()
    }

    if (this.currentState === this.states.FLOORPLAN) {
      this.blueprint3d.model.floorplan.update()
    }

    if (newState === this.states.DEFAULT) {
      this.blueprint3d.three.updateWindowSize()
    }

    // set new state
    this.handleWindowResize()
    this.currentState = newState

    this.stateChangeCallbacks.fire(newState)
  }

  initLeftMenu() {
    window.addEventListener('resize', () => this.handleWindowResize())
    this.handleWindowResize()
  }

  handleWindowResize() {
    $$('.sidebar').forEach((el) => (el.style.height = window.innerHeight + 'px'))
    $('#add-items').style.height = window.innerHeight + 'px'
  }

  // TODO: this doesn't really belong here
  initItems() {
    $$('#add-items .add-item').forEach((el) => {
      el.addEventListener('mousedown', (e) => {
        const target = e.currentTarget
        const modelUrl = target.getAttribute('model-url')
        const itemType = parseInt(target.getAttribute('model-type'))
        const metadata = {
          itemName: target.getAttribute('model-name'),
          resizable: true,
          modelUrl: modelUrl,
          itemType: itemType
        }

        this.blueprint3d.model.scene.addItem(itemType, modelUrl, metadata)
        this.setCurrentState(this.states.DEFAULT)
      })
    })
  }
}

/*
 * Change floor and wall textures
 */

class TextureSelector {
  constructor(blueprint3d, sideMenu) {
    this.blueprint3d = blueprint3d
    this.three = blueprint3d.three
    this.sideMenu = sideMenu
    this.currentTarget = null
    this.init()
  }

  initTextureSelectors() {
    $$('.texture-select-thumbnail').forEach((el) => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget
        const textureUrl = target.getAttribute('texture-url')
        const textureStretch = target.getAttribute('texture-stretch') === 'true'
        const textureScale = parseInt(target.getAttribute('texture-scale'))

        if (this.currentTarget) {
          this.currentTarget.setTexture(textureUrl, textureStretch, textureScale)
        }

        e.preventDefault()
      })
    })
  }

  init() {
    this.three.wallClicked.add((halfEdge) => this.wallClicked(halfEdge))
    this.three.floorClicked.add((room) => this.floorClicked(room))
    this.three.itemSelectedCallbacks.add(() => this.reset())
    this.three.nothingClicked.add(() => this.reset())
    this.sideMenu.stateChangeCallbacks.add(() => this.reset())
    this.initTextureSelectors()
  }

  wallClicked(halfEdge) {
    this.currentTarget = halfEdge
    $('#floorTexturesDiv').style.display = 'none'
    $('#wallTextures').style.display = 'block'
  }

  floorClicked(room) {
    this.currentTarget = room
    $('#wallTextures').style.display = 'none'
    $('#floorTexturesDiv').style.display = 'block'
  }

  reset() {
    $('#wallTextures').style.display = 'none'
    $('#floorTexturesDiv').style.display = 'none'
  }
}

/*
 * Floorplanner controls
 */

class ViewerFloorplanner {
  constructor(blueprint3d) {
    this.blueprint3d = blueprint3d
    this.canvasWrapper = '#floorplanner'
    this.move = '#move'
    this.remove = '#delete'
    this.draw = '#draw'
    this.activeStyle = 'btn-primary disabled'
    this.floorplanner = blueprint3d.floorplanner
    this.init()
  }

  init() {
    window.addEventListener('resize', () => this.handleWindowResize())
    this.handleWindowResize()

    // mode buttons
    this.floorplanner.modeResetCallbacksAPI.add((mode) => {
      removeClass($(this.draw), this.activeStyle)
      removeClass($(this.remove), this.activeStyle)
      removeClass($(this.move), this.activeStyle)

      if (mode === floorplannerModes.MOVE) {
        addClass($(this.move), this.activeStyle)
      } else if (mode === floorplannerModes.DRAW) {
        addClass($(this.draw), this.activeStyle)
      } else if (mode === floorplannerModes.DELETE) {
        addClass($(this.remove), this.activeStyle)
      }

      if (mode === floorplannerModes.DRAW) {
        $('#draw-walls-hint').style.display = 'block'
        this.handleWindowResize()
      } else {
        $('#draw-walls-hint').style.display = 'none'
      }
    })

    $(this.move).addEventListener('click', () => {
      this.floorplanner.setMode(floorplannerModes.MOVE)
    })

    $(this.draw).addEventListener('click', () => {
      this.floorplanner.setMode(floorplannerModes.DRAW)
    })

    $(this.remove).addEventListener('click', () => {
      this.floorplanner.setMode(floorplannerModes.DELETE)
    })
  }

  updateFloorplanView() {
    this.floorplanner.reset()
  }

  handleWindowResize() {
    const wrapper = $(this.canvasWrapper)
    const rect = wrapper.getBoundingClientRect()
    wrapper.style.height = window.innerHeight - rect.top + 'px'
    this.floorplanner.resizeView()
  }
}

/*
 * Main controls
 */

class MainControls {
  constructor(blueprint3d) {
    this.blueprint3d = blueprint3d
    this.init()
  }

  newDesign() {
    this.blueprint3d.model.loadSerialized(JSON.stringify(DefaultFloorplan))
  }

  loadDesign() {
    const files = $('#loadFile').files
    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target.result
      this.blueprint3d.model.loadSerialized(data)
    }
    reader.readAsText(files[0])
  }

  saveDesign() {
    const data = this.blueprint3d.model.exportSerialized()
    const a = window.document.createElement('a')
    const blob = new Blob([data], { type: 'text' })
    a.href = window.URL.createObjectURL(blob)
    a.download = 'design.blueprint3d'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  init() {
    $('#new').addEventListener('click', () => this.newDesign())
    $('#loadFile').addEventListener('change', () => this.loadDesign())
    $('#saveFile').addEventListener('click', () => this.saveDesign())
  }
}

/*
 * Initialize!
 */

export function initBlueprint3d() {
  // main setup
  const opts = {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    textureDir: 'models/textures/',
    widget: false
  }
  const blueprint3d = new Blueprint3d(opts)

  const modalEffects = new ModalEffects(blueprint3d)
  const viewerFloorplanner = new ViewerFloorplanner(blueprint3d)
  const contextMenu = new ContextMenu(blueprint3d)
  const sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects)
  const textureSelector = new TextureSelector(blueprint3d, sideMenu)
  const cameraButtons = new CameraButtons(blueprint3d)
  const mainControls = new MainControls(blueprint3d)

  // This serialization format needs work
  // Load a simple rectangle room
  blueprint3d.model.loadSerialized(JSON.stringify(RichFloorplan))

  return blueprint3d
}

// Export classes for external use if needed
export {
  CameraButtons,
  ContextMenu,
  ModalEffects,
  SideMenu,
  TextureSelector,
  ViewerFloorplanner,
  MainControls
}
