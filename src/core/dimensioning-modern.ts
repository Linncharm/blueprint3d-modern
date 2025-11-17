import { Configuration, configDimUnit } from './configuration-modern';

export const dimInch = 'inch';
export const dimMeter = 'm';
export const dimCentiMeter = 'cm';
export const dimMilliMeter = 'mm';

export class Dimensioning {
  static cmToMeasure(cm: number): string {
    switch (Configuration.getStringValue(configDimUnit)) {
      case dimInch:
        const realFeet = (cm * 0.3937) / 12;
        const feet = Math.floor(realFeet);
        const inches = Math.round((realFeet - feet) * 12);
        return `${feet}'${inches}"`;
      case dimMilliMeter:
        return `${Math.round(10 * cm)} mm`;
      case dimCentiMeter:
        return `${Math.round(10 * cm) / 10} cm`;
      case dimMeter:
      default:
        return `${Math.round(10 * cm) / 1000} m`;
    }
  }
}
