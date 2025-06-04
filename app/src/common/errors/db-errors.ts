export class RepositoryError extends Error {
  entity: string;
  constructor(msg: string, entity: string, cause?: string) {
    super(msg, { cause });
    this.entity = entity;
  }
}

export class RepositoryNotFoundError extends RepositoryError {}
export class RepositoryDuplicateError extends RepositoryError {}
export class RepositoryUnknownError extends RepositoryError {}
