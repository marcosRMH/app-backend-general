import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNumber, IsString, IsNotEmpty } from "class-validator";


export class PortfolioSendMessageResponseDto {
    @ApiProperty({ example: 'correo@correo.com' })
    @IsString()
    @IsNotEmpty()
    email!: string;
    
    @ApiProperty({ example: '9999999999', required: false })
    @IsOptional()
    @IsNumber()
    phone?: number;
    
    @ApiProperty({ example: "hola saludos" })
    @IsString()
    @IsNotEmpty()
    message!: string;

    @ApiProperty({ example: 'recaptcha-token-here' })
    @IsString()
    @IsNotEmpty()
    recaptchaToken!: string;
}