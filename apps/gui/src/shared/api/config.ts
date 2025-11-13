import { ConfigService } from '../config/ConfigService';

export const apiConfig = {
  baseURL: ConfigService.getOrThrow('API_URL'),
  withCredentials: true,
};
