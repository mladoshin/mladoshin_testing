import {
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  RepositoryDuplicateError,
  RepositoryError,
  RepositoryNotFoundError,
  RepositoryUnknownError,
} from './db-errors';

export class ErrorMapper {
  static mapToHTTPError(error: RepositoryError): HttpException {
    switch (error.constructor) {
      case RepositoryNotFoundError:
        return new NotFoundException({
          message: error.message,
          source: error.entity,
        });

      case RepositoryUnknownError:
        return new InternalServerErrorException({
          message: 'Неизвестная ошибка при работе с репозиторием.',
          detail: error.message,
          source: error.entity,
        });
      case RepositoryDuplicateError:
        return new ConflictException({
          message: error.message,
          source: error.entity,
        });

      default:
        return new InternalServerErrorException({
          message: 'Ошибка при выполнении операции.',
          detail: error.message,
          source: error.entity,
        });
    }
  }
}
