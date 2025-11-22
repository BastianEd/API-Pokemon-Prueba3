import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAuthDto {
  @ApiProperty({ example: 'Ash Ketchum', description: 'Nombre del usuario' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ash@pokemon.com', description: 'Correo electrónico único' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pikachu123', description: 'Contraseña segura (mínimo 6 caracteres)' })
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}