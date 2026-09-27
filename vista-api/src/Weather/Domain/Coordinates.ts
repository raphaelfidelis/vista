import { InvalidCoordinatesError } from './Errors/InvalidCoordinates.error';

/** Value object: só existe com latitude e longitude válidas. */
export class Coordinates {
  private _latitude: number;
  private _longitude: number;

  constructor(latitude: number, longitude: number) {
    const valid =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180;

    if (!valid) {
      throw new InvalidCoordinatesError(latitude, longitude);
    }

    this._latitude = latitude;
    this._longitude = longitude;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }
}
