import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // 1. Registro de la Entidad User (Vital para que funcione el Repository)
    TypeOrmModule.forFeature([User]),

    // 2. Inicialización de Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 3. Configuración JWT Asíncrona (Solución al error de tipos)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            // Esto fuerza a TypeScript a aceptar el string sin quejarse.
            // No es la solucion pero funciona
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule, JwtModule], // Exportamos por si otros módulos necesitan proteger rutas
})
export class AuthModule {}