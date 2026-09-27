export class InvalidCoordinatesError extends Error {
  constructor(latitude: number, longitude: number) {
    super(`Coordenadas fora do intervalo válido: ${latitude}, ${longitude}`);
    this.name = 'InvalidCoordinatesError';
  }
}
