import { ICreateUserAvailabilityDto } from "./create-user-availability.dto";

export interface IUpdateUserAvailabilityDto
  extends Partial<ICreateUserAvailabilityDto> {}
