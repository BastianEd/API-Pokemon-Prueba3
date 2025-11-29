import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Librería para encriptar

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // --- SEEDING AUTOMÁTICO AL INICIAR ---
  async onModuleInit() {
    const adminEmail = 'admin@pokestore.cl';

    // Verificamos si ya existe
    const adminExists = await this.userRepository.findOneBy({
      email: adminEmail,
    });

    if (!adminExists) {
      // Crear contraseña encriptada
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Crear usuario admin forzando el rol
      const newAdmin = this.userRepository.create({
        name: 'Admin PokeStore',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin', // <--- Rol Admin Forzado
      });

      await this.userRepository.save(newAdmin);
      this.logger.log(
        '🚀 Usuario Administrador creado automáticamente: admin@pokestore.cl / admin123',
      );
    } else {
      this.logger.log(
        '✅ El usuario Administrador ya existe en la base de datos.',
      );
    }
  }
  // --------------------------------------

  // 1. Registro de Usuario (Público, rol 'user' por defecto)
  async register(registerDto: RegisterAuthDto) {
    const { password, ...userData } = registerDto;

    const userExists = await this.userRepository.findOneBy({
      email: userData.email,
    });
    if (userExists) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      // role: 'user' // Por defecto en la entidad
    });

    await this.userRepository.save(user);

    return {
      message: 'Usuario creado exitosamente',
      user: { name: user.name, email: user.email },
    };
  }

  // 2. Login de Usuario
  async login(loginDto: LoginAuthDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (Email)');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas (Password)');
    }

    // Generamos el Token con 'role' como array para el Frontend
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: [user.role],
      },
    };
  }
}
