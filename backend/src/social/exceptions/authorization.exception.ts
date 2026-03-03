import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthorizationException extends HttpException {
    constructor(message: string = 'You are not authorized to perform this action') {
        super(
            {
                statusCode: HttpStatus.FORBIDDEN,
                message,
                error: 'Authorization Error',
            },
            HttpStatus.FORBIDDEN,
        );
    }
}
