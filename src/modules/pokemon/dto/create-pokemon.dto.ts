import { IsString, MinLength, IsInt, IsOptional, IsUrl } from 'class-validator';
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

  @ApiProperty({ example: 10, required: false })
  @IsInt()
  @IsOptional()
  nivel?: number;

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  imagenUrl?: string;
}