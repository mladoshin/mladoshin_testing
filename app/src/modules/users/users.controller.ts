import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    const user = await this.usersService.create(createUserDto);
    return UserResponse.make(user);
  }

  @Get()
  async findAll(): Promise<UserResponse[]> {
    const users = await this.usersService.findAll();
    return UserResponse.collection(users);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    const user = await this.usersService.findOne(id);
    return UserResponse.make(user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user = await this.usersService.update(id, updateUserDto);
    return UserResponse.make(user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserResponse> {
    const user = await this.usersService.remove(id);
    return UserResponse.make(user);
  }
}
