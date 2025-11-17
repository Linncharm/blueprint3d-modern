import { dimInch } from './dimensioning-modern';

export const configDimUnit = 'dimUnit';
export const configWallHeight = 'wallHeight';
export const configWallThickness = 'wallThickness';

export class Configuration {
  private static data: Record<string, any> = {
    dimUnit: dimInch,
    wallHeight: 250,
    wallThickness: 10
  };

  static setValue(key: string, value: string | number): void {
    this.data[key] = value;
  }

  static getStringValue(key: string): string {
    switch (key) {
      case configDimUnit:
        return this.data[key] as string;
      default:
        throw new Error(`Invalid string configuration parameter: ${key}`);
    }
  }

  static getNumericValue(key: string): number {
    switch (key) {
      case configWallHeight:
      case configWallThickness:
        return this.data[key] as number;
      default:
        throw new Error(`Invalid numeric configuration parameter: ${key}`);
    }
  }
}
