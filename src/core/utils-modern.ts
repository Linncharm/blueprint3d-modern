/**
 * Modern TypeScript utility functions for geometry calculations
 */

export interface Point {
  x: number;
  y: number;
}

/** Collection of utility functions for geometric calculations */
export class Utils {
  /**
   * Determines the distance of a point from a line
   */
  static pointDistanceFromLine(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const point = Utils.closestPointOnLine(x, y, x1, y1, x2, y2);
    const dx = x - point.x;
    const dy = y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Gets the projection of a point onto a line
   */
  static closestPointOnLine(
    x: number,
    y: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Point {
    // Inspired by: http://stackoverflow.com/a/6853926
    const a = x - x1;
    const b = y - y1;
    const c = x2 - x1;
    const d = y2 - y1;

    const dot = a * c + b * d;
    const lenSq = c * c + d * d;
    const param = dot / lenSq;

    let xx: number;
    let yy: number;

    if (param < 0 || (x1 === x2 && y1 === y2)) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * c;
      yy = y1 + param * d;
    }

    return { x: xx, y: yy };
  }

  /**
   * Gets the distance of two points
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Gets the angle between 0,0 -> x1,y1 and 0,0 -> x2,y2 (-pi to pi)
   */
  static angle(x1: number, y1: number, x2: number, y2: number): number {
    const dot = x1 * x2 + y1 * y2;
    const det = x1 * y2 - y1 * x2;
    return -Math.atan2(det, dot);
  }

  /**
   * Shifts angle to be 0 to 2pi
   */
  static angle2pi(x1: number, y1: number, x2: number, y2: number): number {
    let theta = Utils.angle(x1, y1, x2, y2);
    if (theta < 0) {
      theta += 2 * Math.PI;
    }
    return theta;
  }

  /**
   * Checks if an array of points is clockwise
   * @param points Array of points with x,y attributes
   * @returns True if clockwise
   */
  static isClockwise(points: Point[]): boolean {
    // make positive
    const subX = Math.min(
      0,
      Math.min(...points.map((p) => p.x))
    );
    const subY = Math.min(
      0,
      Math.min(...points.map((p) => p.y))
    );

    const newPoints = points.map((p) => ({
      x: p.x - subX,
      y: p.y - subY,
    }));

    // determine CW/CCW, based on:
    // http://stackoverflow.com/questions/1165647
    let sum = 0;
    for (let i = 0; i < newPoints.length; i++) {
      const c1 = newPoints[i];
      const c2 = i === newPoints.length - 1 ? newPoints[0] : newPoints[i + 1];
      sum += (c2.x - c1.x) * (c2.y + c1.y);
    }
    return sum >= 0;
  }

  /**
   * Creates a GUID
   * @returns A new GUID
   */
  static guid(): string {
    const s4 = () =>
      Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);

    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  }

  /**
   * Check if two polygons intersect
   * Both arguments are arrays of corners with x,y attributes
   */
  static polygonPolygonIntersect(
    firstCorners: Point[],
    secondCorners: Point[]
  ): boolean {
    for (let i = 0; i < firstCorners.length; i++) {
      const firstCorner = firstCorners[i];
      const secondCorner =
        i === firstCorners.length - 1 ? firstCorners[0] : firstCorners[i + 1];

      if (
        Utils.linePolygonIntersect(
          firstCorner.x,
          firstCorner.y,
          secondCorner.x,
          secondCorner.y,
          secondCorners
        )
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a line intersects with a polygon
   * Corners is an array of points with x,y attributes
   */
  static linePolygonIntersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    corners: Point[]
  ): boolean {
    for (let i = 0; i < corners.length; i++) {
      const firstCorner = corners[i];
      const secondCorner = i === corners.length - 1 ? corners[0] : corners[i + 1];

      if (
        Utils.lineLineIntersect(
          x1,
          y1,
          x2,
          y2,
          firstCorner.x,
          firstCorner.y,
          secondCorner.x,
          secondCorner.y
        )
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if two lines intersect
   */
  static lineLineIntersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): boolean {
    const ccw = (p1: Point, p2: Point, p3: Point): boolean => {
      const a = p1.x;
      const b = p1.y;
      const c = p2.x;
      const d = p2.y;
      const e = p3.x;
      const f = p3.y;
      return (f - b) * (c - a) > (d - b) * (e - a);
    };

    const p1: Point = { x: x1, y: y1 };
    const p2: Point = { x: x2, y: y2 };
    const p3: Point = { x: x3, y: y3 };
    const p4: Point = { x: x4, y: y4 };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }

  /**
   * Check if a point is inside a polygon using ray casting
   * @param x Point's x coordinate
   * @param y Point's y coordinate
   * @param corners Array of points with x,y attributes
   * @param startX X start coord for raycast
   * @param startY Y start coord for raycast
   */
  static pointInPolygon(
    x: number,
    y: number,
    corners: Point[],
    startX?: number,
    startY?: number
  ): boolean {
    let rayStartX = startX ?? 0;
    let rayStartY = startY ?? 0;

    // Ensure that point(startX, startY) is outside the polygon
    let minX = 0;
    let minY = 0;

    if (startX === undefined || startY === undefined) {
      for (const corner of corners) {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
      }
      rayStartX = minX - 10;
      rayStartY = minY - 10;
    }

    let intersects = 0;
    for (let i = 0; i < corners.length; i++) {
      const firstCorner = corners[i];
      const secondCorner = i === corners.length - 1 ? corners[0] : corners[i + 1];

      if (
        Utils.lineLineIntersect(
          rayStartX,
          rayStartY,
          x,
          y,
          firstCorner.x,
          firstCorner.y,
          secondCorner.x,
          secondCorner.y
        )
      ) {
        intersects++;
      }
    }

    // Odd intersections means the point is in the polygon
    return intersects % 2 === 1;
  }

  /**
   * Checks if all corners of insideCorners are inside the polygon described by outsideCorners
   */
  static polygonInsidePolygon(
    insideCorners: Point[],
    outsideCorners: Point[],
    startX = 0,
    startY = 0
  ): boolean {
    return insideCorners.every((corner) =>
      Utils.pointInPolygon(corner.x, corner.y, outsideCorners, startX, startY)
    );
  }

  /**
   * Checks if any corners of firstCorners is inside the polygon described by secondCorners
   */
  static polygonOutsidePolygon(
    insideCorners: Point[],
    outsideCorners: Point[],
    startX = 0,
    startY = 0
  ): boolean {
    return !insideCorners.some((corner) =>
      Utils.pointInPolygon(corner.x, corner.y, outsideCorners, startX, startY)
    );
  }

  // Array utility methods

  /**
   * Map function for arrays
   */
  static map<T, R>(array: T[], func: (element: T) => R): R[] {
    return array.map(func);
  }

  /**
   * Remove elements in array if func(element) returns true
   */
  static removeIf<T>(array: T[], func: (element: T) => boolean): T[] {
    return array.filter((element) => !func(element));
  }

  /**
   * Shift the items in an array by shift (positive integer)
   */
  static cycle<T>(arr: T[], shift: number): T[] {
    const result = [...arr];
    for (let i = 0; i < shift; i++) {
      const tmp = result.shift();
      if (tmp !== undefined) {
        result.push(tmp);
      }
    }
    return result;
  }

  /**
   * Returns the unique elements in arr
   */
  static unique<T>(arr: T[], hashFunc: (element: T) => string): T[] {
    const results: T[] = [];
    const map: Record<string, boolean> = {};

    for (const element of arr) {
      const hash = hashFunc(element);
      if (!map[hash]) {
        results.push(element);
        map[hash] = true;
      }
    }

    return results;
  }

  /**
   * Remove value from array, if it is present
   */
  static removeValue<T>(array: T[], value: T): void {
    for (let i = array.length - 1; i >= 0; i--) {
      if (array[i] === value) {
        array.splice(i, 1);
      }
    }
  }

  /**
   * Checks if value is in array
   */
  static hasValue<T>(array: T[], value: T): boolean {
    return array.includes(value);
  }

  /**
   * Subtracts the elements in subArray from array
   */
  static subtract<T>(array: T[], subArray: T[]): T[] {
    return Utils.removeIf(array, (el) => Utils.hasValue(subArray, el));
  }
}
