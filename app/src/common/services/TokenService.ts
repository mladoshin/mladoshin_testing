import { Global, Injectable } from '@nestjs/common';
import { sign, verify } from 'jsonwebtoken';

export type TokenPair = {accessToken: string, refreshToken: string}

@Global()
@Injectable()
export class TokenService {
  create<T>(body: T, secret: string, expiresIn: string = '1d') {
    return sign(body, secret, {
      expiresIn: expiresIn,
    });
  }

  verify<T>(token: string, secret: string): T {
    return verify(token, secret);
  }

  refresh<T>(token: string, secret: string){
    const data = this.verify<T>(token, secret);
    console.log(data)
  }
}
