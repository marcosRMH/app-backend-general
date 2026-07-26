import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
    @ApiProperty()
        accessToken!: string;

    @ApiProperty()
        refreshToken!: string;

    @ApiProperty()
        expiresIn!: number;

    @ApiProperty()
        tokenType!: string;

    @ApiProperty({ type: [String], example: ['PORTAL_ADMIN_WEB'] })
        groups!: string[];
}
