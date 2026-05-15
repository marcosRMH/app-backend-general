import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class XNamePortalHeaderDto {
    @ApiProperty({ example: 'mi-portal', description: 'X-Name-Portal header' })
    @IsString()
    @IsNotEmpty()
    readonly 'x-name-portal': string;
}