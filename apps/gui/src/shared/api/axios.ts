import axios from 'axios';
import { apiConfig } from './config';
import { setupInterceptors } from './interceptors';

const axiosInstance = axios.create({
  baseURL: apiConfig.baseURL,
  withCredentials: apiConfig.withCredentials,
});

setupInterceptors(axiosInstance);

export default axiosInstance;
