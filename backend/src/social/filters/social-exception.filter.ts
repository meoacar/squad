import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class SocialExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(SocialExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        let details: any = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as any;
                message = responseObj.message || exception.message;
                error = responseObj.error || error;
                details = responseObj.errors || responseObj.details;
            } else {
                message = exceptionResponse as string;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(
                `Unhandled exception: ${exception.message}`,
                exception.stack,
            );
        }

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            error,
            ...(details && { details }),
        };

        // Log error for monitoring
        if (status >= 500) {
            this.logger.error(
                `${request.method} ${request.url}`,
                JSON.stringify(errorResponse),
            );
        } else if (status >= 400) {
            this.logger.warn(
                `${request.method} ${request.url}`,
                JSON.stringify(errorResponse),
            );
        }

        response.status(status).json(errorResponse);
    }
}
