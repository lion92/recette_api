import {BadRequestException, Body, Controller, Get, Headers, Post, Query} from '@nestjs/common';
import {AuthService} from './auth.service';
import {User} from "../entity/User.entity";import * as dotenv from 'dotenv';
dotenv.config();

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() body: User) {
        return this.authService.register(body);
    }

    @Post('login')
    login(@Body() body:{ username: string; password: string }) {
        return this.authService.login(body.username, body.password);
    }
    @Get('me')
    createRecipe(@Headers('Authorization') authorizationHeader: string) {
        return this.authService.getUserFromToken(authorizationHeader);
    }

    @Get('verify-email')
    async verifyEmail(@Query('token') token: string) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }

        await this.authService.verifyEmail(token);
        return { message: 'Email successfully verified' };
    }

}
