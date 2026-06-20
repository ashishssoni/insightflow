import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'founder@insightflow.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Ashish Soni' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: 'InsightFlow Labs' })
  @IsString()
  @MinLength(2)
  workspaceName!: string;
}
