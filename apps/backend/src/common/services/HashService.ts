import { Global, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

export interface IHashService {
  hash(message: string, rounds?: number): Promise<string>;
  compare(string: string, hash: string): Promise<boolean>;
}

@Global()
@Injectable()
export class BcryptService implements IHashService {
  hash(message: string, rounds?: number): Promise<string> {
    const saltRounds = rounds ?? 10;
    return bcrypt.hash(message, saltRounds);
  }

  compare(string: string, hash: string): Promise<boolean> {
    return bcrypt.compare(string, hash);
  }
}
