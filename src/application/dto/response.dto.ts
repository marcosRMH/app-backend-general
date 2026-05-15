import { ApiProperty } from "@nestjs/swagger";


export class ResponseDto {
    @ApiProperty({ example: 200 })
        code!: number;
    
    @ApiProperty({ example: 'OK' })
        status!: string;
    
    @ApiProperty({ example: "respondio correctamente" })
        message!: string;
    
    @ApiProperty({ example: "[]" })
        detail!: string[];
    
}