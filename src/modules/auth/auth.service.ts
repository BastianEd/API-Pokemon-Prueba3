import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Librería para encriptar

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // 1. Registro de Usuario
  async register(registerDto: RegisterAuthDto) {
    const { password, ...userData } = registerDto;

    // Validar si el email ya existe
    const userExists = await this.userRepository.findOneBy({
      email: userData.email,
    });
    if (userExists) {
      throw new BadRequestException('El correo ya está registrado');
    }

    // Encriptar contraseña (hash)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Guardar usuario
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    // Retornamos lo mismo que el login para que entre directo
    return {
      message: 'Usuario creado exitosamente',
      user: { name: user.name, email: user.email },
    };
  }

  // 2. Login de Usuario
  async login(loginDto: LoginAuthDto) {
    const { email, password } = loginDto;

    // Buscamos el usuario y pedimos que traiga el password (que estaba oculto por select: false)
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (Email)');
    }

    // Comparamos la contraseña plana con la encriptada
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas (Password)');
    }

    // Generamos el Token
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
        role: user.role, // Devolvemos el rol al frontend también
      },
    };
  }
}
