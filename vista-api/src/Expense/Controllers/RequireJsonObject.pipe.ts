import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * No Express 5, uma requisição sem corpo JSON chega com `body` undefined (no 4
 * era `{}`). Sem este pipe, o service quebraria ao ler os campos e a resposta
 * seria 500. Aqui só se garante que existe um objeto; os campos são validados
 * pelo domínio.
 */
@Injectable()
export class RequireJsonObjectPipe implements PipeTransform<unknown, object> {
  transform(value: unknown): object {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException(
        'O corpo da requisição deve ser um objeto JSON',
      );
    }

    return value;
  }
}
