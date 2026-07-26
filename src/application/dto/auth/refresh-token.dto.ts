import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({ example: '1 abcdefghijklmnopqrstuvwxyz' })
    @IsString()
    @IsNotEmpty()
        refreshToken!: string;
}
