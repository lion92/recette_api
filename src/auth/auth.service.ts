import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/User.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { isEmail } from "class-validator";
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import * as process from "process";
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    // Méthode d'enregistrement (register)
    async register(createUserDto: User): Promise<User> {
        const { email, password } = createUserDto;

        // Vérification de l'email
        if (!isEmail(email)) {
            throw new BadRequestException('Invalid email format');
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        // Hash du mot de passe
        const hashedPassword = await this.hashPassword(password);

        // Générer un token de validation par email
        const emailVerificationToken = uuidv4();

        // Création d'un nouvel utilisateur
        const newUser = this.userRepository.create({
            email,
            password: hashedPassword,
            emailVerificationToken,
            isEmailVerified: false, // Ajouter un champ pour suivre la vérification de l'email
        });

        // Sauvegarde de l'utilisateur en base de données
        const savedUser = await this.userRepository.save(newUser);

        // Envoyer l'email de validation
        await this.sendVerificationEmail(email, emailVerificationToken);

        return savedUser;
    }

    // Méthode pour envoyer l'email de validation
    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const transporter = nodemailer.createTransport({
            host: 'mail.krissclotilde.com',
            port: 465,
            secure: true, // Utiliser SSL/TLS
            auth: {
                user: 'noreply_justerecipes@krissclotilde.com',
                pass: process.env.MAIL, // Mot de passe de votre compte
            },
            tls: {
                rejectUnauthorized: false, // Ignore les erreurs de certificat
            },
        });


        const verificationUrl = `https://www.krisscode.fr/recette/auth/verify-email?token=${token}`;

        const mailOptions = {
            from: 'noreply_justerecipes@krissclotilde.com',
            to: email,
            subject: 'Email Verification',
            text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
        };

        await transporter.sendMail(mailOptions);
    }

    // Méthode pour vérifier l'email
    async verifyEmail(token: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { emailVerificationToken: token } });

        if (!user) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = token; // Supprimer le token après la vérification

        await this.userRepository.save(user);
    }

    // Méthode de connexion (login)
    async login(email: string, password: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Vérification si l'email a été confirmé
        if (!user.isEmailVerified) {
            throw new UnauthorizedException('Email not verified');
        }

        // Vérification du mot de passe
        const isPasswordValid = await this.comparePasswords(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        // Génération du JWT
        const jwt = await this.jwtService.signAsync(
            { id: user.id },
            { secret: process.env.SECRET }
        );

        return { jwt };
    }

    // Méthodes utilitaires pour hasher et comparer les mots de passe
    private async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    // Méthode pour obtenir l'utilisateur à partir du token JWT
    async getUserFromToken(authorizationHeader: string): Promise<User> {
        if (!authorizationHeader) {
            throw new UnauthorizedException('Token JWT manquant');
        }

        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe "Bearer"

        try {
            // Vérification du token JWT
            const decodedToken = await this.jwtService.verifyAsync(token, {
                secret: process.env.SECRET, // Utiliser la clé secrète correcte
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
