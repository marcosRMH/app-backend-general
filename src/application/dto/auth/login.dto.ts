import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
        email!: string;

    @ApiProperty({ example: 'P@ssw0rd123' })
    @IsString()
    @IsNotEmpty()
        password!: string;
}
