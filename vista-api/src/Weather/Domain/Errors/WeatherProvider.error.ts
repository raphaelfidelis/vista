/** O provedor de clima falhou ou respondeu algo que não dá para usar. */
export class WeatherProviderError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'WeatherProviderError';
  }
}
