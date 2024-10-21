import {Injectable, ConflictException, UnauthorizedException, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/User.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {compare} from "bcrypt";
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) {}

    // Méthode d'enregistrement (register)
    async register(createUserDto: User): Promise<User> {
        const { username, password } = createUserDto;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await this.userRepository.findOne({ where: { username } });
        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        // Hasher le mot de passe avant de le sauvegarder
        const hashedPassword = await this.hashPassword(password);

        // Créer un nouvel utilisateur avec le mot de passe hashé
        const newUser = this.userRepository.create({
            username,
            password: hashedPassword,
        });

        // Sauvegarder le nouvel utilisateur en base de données
        return this.userRepository.save(newUser);
    }

    // Méthode de connexion (login)
    async login(username: string, password: string) {
        const userFind = await this.userRepository.findOneBy({ username: username });
        if (!userFind) {
            throw new NotFoundException('User Not found');
        } else {
            let bool = await compare(password, userFind.password);
            if (!bool) {
                throw new UnauthorizedException('illegal');
            } else {
                const jwt = await this.jwtService.signAsync({id: userFind.id}, {secret: ""+process.env.SECRET});

                return {jwt};
            }
        }
    }
    // Génération du token JWT
    private generateToken(user: User): string {
        const payload = { userId: user.id, username: user.username };
        return this.jwtService.sign(payload);
    }

    // Méthode de validation de mot de passe

    // Méthode pour comparer les mots de passe
    private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    // Méthode pour hasher le mot de passe
    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
    async getUserFromToken(authorizationHeader: string): Promise<User> {
        if (!authorizationHeader) {
            throw new UnauthorizedException('Token JWT manquant');
        }

        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe "Bearer"

        try {
            // Vérification du token JWT
            const decodedToken = await this.jwtService.verifyAsync(token, {
                secret: ""+process.env.JWT_SECRET, // Utiliser la clé secrète correcte
            });

            // Extraction de l'ID de l'utilisateur à partir du token
            const userId = decodedToken?.id;

            // Recherche de l'utilisateur dans la base de données
            const user = await this.userRepository.findOne({ where: { id: userId } });

            if (!user) {
                throw new NotFoundException('Utilisateur non trouvé');
            }

            return user;
        } catch (error) {
            throw new UnauthorizedException('Token JWT invalide ou expiré');
        }
    }


}
