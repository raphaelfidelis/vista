import { Injectable } from '@nestjs/common';
import { Clock } from '../Domain/Clock';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
});

/** O relógio de verdade: hoje em São Paulo, e não no fuso de onde o servidor roda. */
@Injectable()
export class SystemClock implements Clock {
  today(): string {
    return formatter.format(new Date());
  }
}
