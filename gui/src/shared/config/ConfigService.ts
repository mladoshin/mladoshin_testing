export class ConfigService {
  static getOrThrow(key: string): string {
    const fullKey = `VITE_${key}`;
    const value = import.meta.env[fullKey as keyof ImportMetaEnv];

    if (!value) {
      throw new Error(`Missing env variable: ${fullKey}`);
    }

    return value;
  }

  static getOptional(key: string): string | undefined {
    const fullKey = `VITE_${key}`;
    return import.meta.env[fullKey as keyof ImportMetaEnv];
  }
}
