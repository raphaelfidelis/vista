import { Injectable } from '@nestjs/common';
import { AuthClock } from '../../Domain/Services/AuthClock';

@Injectable()
export class SystemAuthClock implements AuthClock {
  now(): Date {
    return new Date();
  }
}
