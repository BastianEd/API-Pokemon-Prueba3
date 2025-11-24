import {
  IsString,
  MinLength,
  IsInt,
  IsOptional,
  IsUrl,
  IsPositive,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePokemonDto {
  // ApiProperty sirve para que Swagger muestre el ejemplo
  @ApiProperty({ example: 'Pikachu', description: 'Nombre del Pokémon' })
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiProperty({ example: 'Eléctrico', description: 'Tipo elemental' })
  @IsString()
  tipo: string;

  @ApiProperty({ example: 500, description: 'Precio del Pokémon en monedas' })
  @IsInt({ message: 'El precio debe ser un número entero' })
  @IsPositive()
  @Min(1)
  precio: number;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  imagenUrl?: string;
}
