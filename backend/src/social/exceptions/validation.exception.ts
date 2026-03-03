import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
    constructor(message: string, errors?: Record<string, any>) {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message,
                errors,
                error: 'Validation Error',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
