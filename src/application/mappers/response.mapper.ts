
import { ResponseDto } from '@application/dto/response.dto';

export class ResponseMapper {
  static toResponse(response: ResponseDto): ResponseDto {
    const dto = new ResponseDto();
    dto.code = response.code;
    dto.detail = response.detail;
    dto.message = response.message;
    dto.status = response.status;
    dto.data = response?.data;
    return dto;
  }
}