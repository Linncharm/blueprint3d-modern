/**
 * Blueprint3D core application - Modern ES6 version
 */

import { Model } from './model/model';
import { Main as ThreeMain } from './three/main';
import { Floorplanner } from './floorplanner/floorplanner';

/** Startup options for Blueprint3D */
export interface Options {
  /** Run in widget mode (disables controls) */
  widget?: boolean;

  /** Selector for the Three.js container element */
  threeElement?: string;

  /** ID for the Three.js canvas element */
  threeCanvasElement?: string;

  /** ID for the floorplanner canvas element */
  floorplannerElement?: string;

  /** The texture directory path */
  textureDir?: string;
}

/**
 * Blueprint3D core application class
 * Main entry point for the floor planning application
 */
export class Blueprint3d {
  public readonly model: Model;
  public readonly three: ThreeMain;
  public readonly floorplanner?: Floorplanner;

  /**
   * Creates an instance of Blueprint3D
   * @param options - The initialization options
   */
  constructor(options: Options) {
    // Initialize the model
    this.model = new Model(options.textureDir);

    // Initialize Three.js renderer
    this.three = new ThreeMain(
      this.model,
      options.threeElement,
      options.threeCanvasElement,
      {}
    );

    // Initialize floorplanner (unless in widget mode)
    if (!options.widget) {
      this.floorplanner = new Floorplanner(
        options.floorplannerElement!,
        this.model.floorplan
      );
    } else {
      // Disable controls in widget mode
      this.three.getController().enabled = false;
    }
  }

  /**
   * Load a design from serialized data
   */
  loadDesign(data: string): void {
    this.model.loadSerialized(data);
  }

  /**
   * Export the current design as serialized data
   */
  exportDesign(): string {
    return this.model.exportSerialized();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Add cleanup logic here
    if (this.floorplanner) {
      // this.floorplanner.destroy();
    }
    // this.three.destroy();
  }
}
