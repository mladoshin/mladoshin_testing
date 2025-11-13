export class ValidationError extends Error {
  public readonly messages: string[];

  constructor(rawError: any) {
    const messages = ValidationError.extractMessages(rawError);
    super(messages.join('\n'));
    this.name = 'ValidationError';
    this.messages = messages;
  }

  static extractMessages(error: any): string[] {
    if (error?.response?.statusCode === 400 && Array.isArray(error.response.message)) {
      return error.response.message;
    }
    if (Array.isArray(error.message)) {
      return error.message;
    }
    if (typeof error.message === 'string') {
      return [error.message];
    }
    return ['Unknown validation error'];
  }

  toList(): string[] {
    return this.messages;
  }

  toObject(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const message of this.messages) {
      const [field, ...rest] = message.split(' ');
      const key = field.toLowerCase();
      if (!result[key]) result[key] = [];
      result[key].push(rest.join(' '));
    }
    return result;
  }
}

export class ForbiddenError extends Error {
  constructor(rawError: any) {
    super(rawError.response.data.message);
    this.name = 'ForbiddenError';
  }
}
