import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
    constructor(resource: string, identifier?: string) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;

        super(
            {
                statusCode: HttpStatus.NOT_FOUND,
                message,
                error: 'Not Found',
            },
            HttpStatus.NOT_FOUND,
        );
    }
}
