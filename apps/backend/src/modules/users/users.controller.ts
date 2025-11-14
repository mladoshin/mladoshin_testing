import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  Req,
} from '@nestjs/common';
import { IUsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse } from './dto/user-response.dto';
import { AccessLog } from 'src/common/logging/access-log.decorator';

@Controller('users')
export class UsersController {
  constructor(@Inject('IUsersService') private readonly usersService: IUsersService) {}

  @Post()
  @AccessLog()
  async create(@Body() createUserDto: CreateUserDto, @Req() req): Promise<UserResponse> {
    const user = await this.usersService.create(createUserDto, {schema: req.headers['x-test-schema']});
    return UserResponse.make(user);
  }

  @Get()
  @AccessLog()
  async findAll(@Req() req): Promise<UserResponse[]> {
    const users = await this.usersService.findAll({schema: req.headers['x-test-schema']});
    return UserResponse.collection(users);
  }

  @Get(':id')
  @AccessLog()
  async findOne(@Param('id') id: string, @Req() req): Promise<UserResponse> {
    const user = await this.usersService.findOne(id, {schema: req.headers['x-test-schema']});
    return UserResponse.make(user);
  }

  @Patch(':id')
  @AccessLog()
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ): Promise<UserResponse> {
    const user = await this.usersService.update(id, updateUserDto, {schema: req.headers['x-test-schema']});
    return UserResponse.make(user);
  }

  @Delete(':id')
  @AccessLog()
  async remove(@Param('id') id: string, @Req() req): Promise<UserResponse> {
    const user = await this.usersService.remove(id, {schema: req.headers['x-test-schema']});
    return UserResponse.make(user);
  }
}
