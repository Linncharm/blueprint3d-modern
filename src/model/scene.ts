import * as THREE from 'three';
import { Utils } from '../core/utils';
import { EventEmitter } from '../core/events';
import { Factory } from '../items/factory';
import type { Item } from '../items/item';
import type { Model } from './model';
import { JSONLoader } from '../loaders/JSONLoader';

/**
 * The Scene is a manager of Items and also links to a ThreeJS scene.
 */
export class Scene {

    /** The associated ThreeJS scene. */
    private scene: THREE.Scene;

    /** */
    private items: Item[] = [];

    /** */
    public needsUpdate = false;

    /** The Json loader. */
    private loader: JSONLoader;

    /** */
    private itemLoadingCallbacks = new EventEmitter<void>();

    /** Item */
    public itemLoadedCallbacks = new EventEmitter<Item>();

    /** Item */
    public itemRemovedCallbacks = new EventEmitter<Item>();

    /**
     * Constructs a scene.
     * @param model The associated model.
     * @param textureDir The directory from which to load the textures.
     */
    constructor(private model: Model, private textureDir: string) {
      this.scene = new THREE.Scene();

      // init item loader
      // Use custom JSONLoader for old three.js JSON format models
      this.loader = new JSONLoader();
    }

    /** Adds a non-item, basically a mesh, to the scene.
     * @param mesh The mesh to be added.
     */
    public add(mesh: THREE.Mesh): void {
      this.scene.add(mesh);
    }

    /** Removes a non-item, basically a mesh, from the scene.
     * @param mesh The mesh to be removed.
     */
    public remove(mesh: THREE.Mesh): void {
      this.scene.remove(mesh);
      if (this.items.includes(mesh as unknown as Item)) {
        Utils.removeValue(this.items, mesh as unknown as Item);
      }
    }

    /** Gets the scene.
     * @returns The scene.
     */
    public getScene(): THREE.Scene {
      return this.scene;
    }

    /** Gets the items.
     * @returns The items.
     */
    public getItems(): Item[] {
      return this.items;
    }

    /** Gets the count of items.
     * @returns The count.
     */
    public itemCount(): number {
      return this.items.length
    }

    /** Removes all items. */
    public clearItems(): void {
      this.items.forEach((item) => {
        this.removeItem(item, true);
      });
      this.items = []
    }

    /**
     * Removes an item.
     * @param item The item to be removed.
     * @param dontRemove If not set, also remove the item from the items list.
     */
    public removeItem(item: Item, dontRemove: boolean = false): void {
      // use this for item meshes
      this.itemRemovedCallbacks.fire(item);
      item.removed();
      this.scene.remove(item);
      if (!dontRemove) {
        Utils.removeValue(this.items, item);
      }
    }

    /**
     * Creates an item and adds it to the scene.
     * @param itemType The type of the item given by an enumerator.
     * @param fileName The name of the file to load.
     * @param metadata TODO
     * @param position The initial position.
     * @param rotation The initial rotation around the y axis.
     * @param scale The initial scaling.
     * @param fixed True if fixed.
     */
    public addItem(itemType: number, fileName: string, metadata: Record<string, unknown>, position?: THREE.Vector3, rotation?: number, scale?: THREE.Vector3, fixed?: boolean): void {
      itemType = itemType || 1;
      console.log('addItem called with:', {
        position: position,
        rotation: rotation,
        scale: scale,
        fixed: fixed
      });
      const scope = this;
      const loaderCallback = (geometry: THREE.BufferGeometry, materials: THREE.Material[]) => {
        console.log('Creating item with materials:', {
          loadedMaterials: materials.length,
          materialTypes: materials.map(m => m.type)
        });

        // Ensure materials are properly configured for visibility
        materials.forEach(mat => {
          // Make sure materials are double-sided to avoid backface culling issues
          mat.side = THREE.DoubleSide;
          // Enable depth testing and writing
          mat.depthTest = true;
          mat.depthWrite = true;
        });

        // Custom JSONLoader already returns BufferGeometry
        const item = new (Factory.getClass(itemType))(
          scope.model,
          metadata, geometry,
          materials,  // Use actual materials from the loaded model
          position,
          rotation,
          scale
        );
        item.fixed = fixed || false;
        scope.items.push(item);
        scope.add(item);

        console.log('Item added to scene:', {
          itemsCount: scope.items.length,
          itemType: item.constructor.name,
          itemVisible: item.visible,
          itemInSceneChildren: scope.scene.children.includes(item),
          itemPosition: item.position,
          itemScale: item.scale,
          sceneChildrenCount: scope.scene.children.length
        });


        item.initObject();
        scope.itemLoadedCallbacks.fire(item);
      }

      this.itemLoadingCallbacks.fire();

      // Wrap in try-catch for better error handling
      try {
        this.loader.load(
          fileName,
          loaderCallback,
          undefined, // TODO_Ekki
          (error: any) => {
            console.error('Error loading model:', fileName, error);
            alert('Failed to load model: ' + fileName + '\n\nThis is a known issue with the old three.js version.\nTry a simpler model or upgrade three.js.');
            this.itemLoadingCallbacks.fire();
          }
        );
      } catch (e) {
        console.error('Exception loading model:', e);
        this.itemLoadingCallbacks.fire();
      }
    }
  }
