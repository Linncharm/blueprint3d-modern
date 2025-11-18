import * as THREE from 'three';
import { Floor } from './floor';
import { Edge } from './edge';
import type { Floorplan as FloorplanModel } from '../model/floorplan';
import type { Controls } from './controls';

export class FloorplanThree {
  public readonly scene: THREE.Scene;
  public readonly floorplan: FloorplanModel;
  public readonly controls: Controls;
  public floors: Floor[] = [];
  public edges: Edge[] = [];

  constructor(scene: THREE.Scene, floorplan: FloorplanModel, controls: Controls) {
    this.scene = scene;
    this.floorplan = floorplan;
    this.controls = controls;

    this.floorplan.fireOnUpdatedRooms(this.redraw.bind(this));
  }

  private redraw(): void {
    // clear scene
    this.floors.forEach((floor) => {
      floor.removeFromScene();
    });

    this.edges.forEach((edge) => {
      edge.remove();
    });
    this.floors = [];
    this.edges = [];

    // draw floors
    this.floorplan.getRooms().forEach((room) => {
      const threeFloor = new Floor(this.scene, room);
      this.floors.push(threeFloor);
      threeFloor.addToScene();
    });

    // draw edges
    this.floorplan.wallEdges().forEach((edge) => {
      const threeEdge = new Edge(
        this.scene, edge, this.controls);
      this.edges.push(threeEdge);
    });
  }
}
