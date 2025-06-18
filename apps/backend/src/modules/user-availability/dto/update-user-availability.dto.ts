import { PartialType } from '@nestjs/mapped-types';
import { CreateUserAvailabilityDto } from './create-user-availability.dto';
import { IUpdateUserAvailabilityDto } from '@shared/types';

export class UpdateUserAvailabilityDto
  extends PartialType(CreateUserAvailabilityDto)
  implements IUpdateUserAvailabilityDto {}
