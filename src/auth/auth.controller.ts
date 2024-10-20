import {Controller, Post, Body, Get, UnauthorizedException, Headers} from '@nestjs/common';
import { AuthService } from './auth.service';
import {User} from "../entity/User.entity";
import {RecipeData} from "../interface/Recipe";

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

}
