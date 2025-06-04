import { Global, Inject, Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface IAppLoggerService extends LoggerService {
  accessLog(message: string, context?: string): void;
}

@Injectable()
@Global()
export class AppLoggerService implements IAppLoggerService {
  private readonly logFilePath: string;
  private readonly accessLogFilePath: string;
  private readonly errorFilePath: string;

  constructor(@Inject() configService: ConfigService) {
    this.logFilePath = path.join(
      __dirname,
      '../../../../logs',
      configService.getOrThrow('LOG_FILE'),
    );
    this.errorFilePath = path.join(
      __dirname,
      '../../../../logs',
      configService.getOrThrow('LOG_ERROR_FILE'),
    );

    this.accessLogFilePath = path.join(
      __dirname,
      '../../../../logs',
      configService.getOrThrow('LOG_ACCESS_FILE'),
    );

    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private writeToFile(
    filePath: string,
    level: string,
    message: string,
    context?: string,
    trace?: string,
  ) {
    const timestamp = new Date().toISOString();
    const contextText = context ? `[${context}] ` : '';
    const traceText = trace ? `\nTrace: ${trace}` : '';
    const logLine = `${timestamp} ${level.toUpperCase()} ${contextText}${message}${traceText}\n`;
    fs.appendFileSync(filePath, logLine);
  }

  accessLog(message: string, context?: string) {
    console.log(`[ACCESS LOG] ${message}`);
    this.writeToFile(this.accessLogFilePath, 'access-log', message, context);
  }

  log(message: string, context?: string) {
    console.log(`[LOG] ${message}`);
    this.writeToFile(this.logFilePath, 'log', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[ERROR] ${message}`);
    this.writeToFile(this.errorFilePath, 'error', message, context, trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[WARN] ${message}`);
    this.writeToFile(this.logFilePath, 'warn', message, context);
  }

  debug(message: string, context?: string) {
    console.debug(`[DEBUG] ${message}`);
    this.writeToFile(this.logFilePath, 'debug', message, context);
  }

  verbose(message: string, context?: string) {
    console.info(`[VERBOSE] ${message}`);
    this.writeToFile(this.logFilePath, 'verbose', message, context);
  }
}
