/**
 * Modern Blueprint3D Example - No jQuery
 * Demonstrates modern TypeScript and DOM APIs
 */

// Will be available after we build the library
// import { Blueprint3d } from '../dist/blueprint3d.es.js';

// For now, we'll use the existing BP3D namespace
declare const BP3D: any;

/**
 * Camera control utilities
 */
class CameraControls {
  private orbitControls: any;
  private three: any;
  private panSpeed = 30;

  constructor(blueprint3d: any) {
    this.orbitControls = blueprint3d.three.controls;
    this.three = blueprint3d.three;
    this.init();
  }

  private init(): void {
    // Zoom controls
    const zoomIn = document.getElementById('zoom-in')!;
    const zoomOut = document.getElementById('zoom-out')!;

    zoomIn.addEventListener('click', this.handleZoomIn.bind(this));
    zoomOut.addEventListener('click', this.handleZoomOut.bind(this));

    // Pan controls
    const moveLeft = document.getElementById('move-left')!;
    const moveRight = document.getElementById('move-right')!;
    const moveUp = document.getElementById('move-up')!;
    const moveDown = document.getElementById('move-down')!;

    moveLeft.addEventListener('click', () => this.pan('LEFT'));
    moveRight.addEventListener('click', () => this.pan('RIGHT'));
    moveUp.addEventListener('click', () => this.pan('UP'));
    moveDown.addEventListener('click', () => this.pan('DOWN'));

    // Reset view
    const resetView = document.getElementById('reset-view')!;
    resetView.addEventListener('click', () => this.three.centerCamera());
  }

  private handleZoomIn(e: Event): void {
    e.preventDefault();
    this.orbitControls.dollyIn(1.1);
    this.orbitControls.update();
  }

  private handleZoomOut(e: Event): void {
    e.preventDefault();
    this.orbitControls.dollyOut(1.1);
    this.orbitControls.update();
  }

  private pan(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): void {
    const { panSpeed } = this;

    switch (direction) {
      case 'UP':
        this.orbitControls.panXY(0, panSpeed);
        break;
      case 'DOWN':
        this.orbitControls.panXY(0, -panSpeed);
        break;
      case 'LEFT':
        this.orbitControls.panXY(panSpeed, 0);
        break;
      case 'RIGHT':
        this.orbitControls.panXY(-panSpeed, 0);
        break;
    }
  }
}

/**
 * File operations handler
 */
class FileOperations {
  private blueprint3d: any;

  constructor(blueprint3d: any) {
    this.blueprint3d = blueprint3d;
    this.init();
  }

  private init(): void {
    const newBtn = document.getElementById('new-btn')!;
    const loadBtn = document.getElementById('load-btn')!;
    const saveBtn = document.getElementById('save-btn')!;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;

    newBtn.addEventListener('click', () => this.newDesign());
    loadBtn.addEventListener('click', () => fileInput.click());
    saveBtn.addEventListener('click', () => this.saveDesign());
    fileInput.addEventListener('change', (e) => this.loadDesign(e));
  }

  private newDesign(): void {
    // Load default empty room
    const defaultDesign = {
      floorplan: {
        corners: {
          'f90da5e3-9e0e-eba7-173d-eb0b071e838e': { x: 204.851, y: 289.052 },
          'da026c08-d76a-a944-8e7b-096b752da9ed': { x: 672.211, y: 289.052 },
          '4e3d65cb-54c0-0681-28bf-bddcc7bdb571': { x: 672.211, y: -178.308 },
          '71d4f128-ae80-3d58-9bd2-711c6ce6cdf2': { x: 204.851, y: -178.308 }
        },
        walls: [
          {
            corner1: '71d4f128-ae80-3d58-9bd2-711c6ce6cdf2',
            corner2: 'f90da5e3-9e0e-eba7-173d-eb0b071e838e',
            frontTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 },
            backTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 }
          },
          {
            corner1: 'f90da5e3-9e0e-eba7-173d-eb0b071e838e',
            corner2: 'da026c08-d76a-a944-8e7b-096b752da9ed',
            frontTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 },
            backTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 }
          },
          {
            corner1: 'da026c08-d76a-a944-8e7b-096b752da9ed',
            corner2: '4e3d65cb-54c0-0681-28bf-bddcc7bdb571',
            frontTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 },
            backTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 }
          },
          {
            corner1: '4e3d65cb-54c0-0681-28bf-bddcc7bdb571',
            corner2: '71d4f128-ae80-3d58-9bd2-711c6ce6cdf2',
            frontTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 },
            backTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 }
          }
        ],
        wallTextures: [],
        floorTextures: {},
        newFloorTextures: {}
      },
      items: []
    };

    this.blueprint3d.model.loadSerialized(JSON.stringify(defaultDesign));
  }

  private loadDesign(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      this.blueprint3d.model.loadSerialized(data);
    };
    reader.readAsText(files[0]);
  }

  private saveDesign(): void {
    const data = this.blueprint3d.model.exportSerialized();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'design.blueprint3d';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * View mode switcher
 */
class ViewSwitcher {
  private currentMode: 'design' | 'floorplan' = 'design';
  private blueprint3d: any;

  constructor(blueprint3d: any) {
    this.blueprint3d = blueprint3d;
    this.init();
  }

  private init(): void {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.tab as 'design' | 'floorplan';
        this.switchMode(mode);
      });
    });
  }

  private switchMode(mode: 'design' | 'floorplan'): void {
    if (this.currentMode === mode) return;

    this.currentMode = mode;

    // Update active tab
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.remove('active');
      if ((btn as HTMLElement).dataset.tab === mode) {
        btn.classList.add('active');
      }
    });

    // Toggle views
    const viewer = document.getElementById('viewer')!;
    const floorplanner = document.getElementById('floorplanner-canvas')!;
    const floorplanControls = document.getElementById('floorplan-controls')!;

    if (mode === 'floorplan') {
      viewer.style.display = 'none';
      floorplanner.style.display = 'block';
      floorplanControls.style.display = 'block';

      if (this.blueprint3d.floorplanner) {
        this.blueprint3d.floorplanner.reset();
        this.blueprint3d.floorplanner.resizeView();
      }
    } else {
      viewer.style.display = 'block';
      floorplanner.style.display = 'none';
      floorplanControls.style.display = 'none';

      this.blueprint3d.model.floorplan.update();
      this.blueprint3d.three.updateWindowSize();
    }
  }
}

/**
 * Loading modal
 */
class LoadingModal {
  private loadingElement: HTMLElement;
  private itemsLoading = 0;

  constructor(blueprint3d: any) {
    this.loadingElement = document.getElementById('loading')!;
    this.init(blueprint3d);
  }

  private init(blueprint3d: any): void {
    blueprint3d.model.scene.itemLoadingCallbacks.add(() => {
      this.itemsLoading++;
      this.update();
    });

    blueprint3d.model.scene.itemLoadedCallbacks.add(() => {
      this.itemsLoading--;
      this.update();
    });
  }

  private update(): void {
    this.loadingElement.style.display = this.itemsLoading > 0 ? 'block' : 'none';
  }
}

/**
 * Initialize the application
 */
function initApp(): void {
  // Wait for BP3D to be available (loaded from the old bundle)
  if (typeof BP3D === 'undefined') {
    console.error('BP3D is not loaded. Make sure to include the blueprint3d library.');
    return;
  }

  const options = {
    floorplannerElement: 'floorplanner-canvas',
    threeElement: '#viewer',
    threeCanvasElement: 'three-canvas',
    textureDir: 'models/textures/',
    widget: false
  };

  const blueprint3d = new BP3D.Blueprint3d(options);

  // Initialize controllers
  new CameraControls(blueprint3d);
  new FileOperations(blueprint3d);
  new ViewSwitcher(blueprint3d);
  new LoadingModal(blueprint3d);

  // Load default design
  const defaultDesign = {
    floorplan: {
      corners: {
        'f90da5e3-9e0e-eba7-173d-eb0b071e838e': { x: 204.851, y: 289.052 },
        'da026c08-d76a-a944-8e7b-096b752da9ed': { x: 672.211, y: 289.052 },
        '4e3d65cb-54c0-0681-28bf-bddcc7bdb571': { x: 672.211, y: -178.308 },
        '71d4f128-ae80-3d58-9bd2-711c6ce6cdf2': { x: 204.851, y: -178.308 }
      },
      walls: [
        {
          corner1: '71d4f128-ae80-3d58-9bd2-711c6ce6cdf2',
          corner2: 'f90da5e3-9e0e-eba7-173d-eb0b071e838e',
          frontTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 },
          backTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 }
        },
        {
          corner1: 'f90da5e3-9e0e-eba7-173d-eb0b071e838e',
          corner2: 'da026c08-d76a-a944-8e7b-096b752da9ed',
          frontTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 },
          backTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 }
        },
        {
          corner1: 'da026c08-d76a-a944-8e7b-096b752da9ed',
          corner2: '4e3d65cb-54c0-0681-28bf-bddcc7bdb571',
          frontTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 },
          backTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 }
        },
        {
          corner1: '4e3d65cb-54c0-0681-28bf-bddcc7bdb571',
          corner2: '71d4f128-ae80-3d58-9bd2-711c6ce6cdf2',
          frontTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 },
          backTexture: { url: 'rooms/textures/wallmap.png', stretch: true, scale: 0 }
        }
      ],
      wallTextures: [],
      floorTextures: {},
      newFloorTextures: {}
    },
    items: []
  };

  blueprint3d.model.loadSerialized(JSON.stringify(defaultDesign));

  console.log('Blueprint3D Modern Example Initialized!');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
