import { Response } from "express";
import { TokenPair } from "src/common/services/TokenService";

export class AuthResponse{
    access_token: string;
    constructor(tokenPair: TokenPair, response: Response){
        this.access_token = tokenPair.accessToken;
        response.cookie('refresh_token', tokenPair.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: true
        })
    }

    static make(tokenPair: TokenPair, response: Response){
        return new AuthResponse(tokenPair, response);
    }
}