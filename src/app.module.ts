import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PokemonModule } from './modules/pokemon/pokemon.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // 1. Cargar variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configurar conexión a Base de Datos
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost', // Fallback a localhost
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pokemon_db',
      autoLoadEntities: true, // Importante para que lea las entidades sin declararlas manual una por una aquí
      synchronize: true, // Solo en desarrollo
    }),

    PokemonModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
