import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta simplificada de un Pokémon desde PokéAPI.
 *
 * @remarks
 * Este DTO define la estructura de datos que devolvemos al cliente
 * cuando consultamos la API externa, incluyendo solo la información relevante.
 */
export class PokemonResponseDto {
  /**
   * Nombre del Pokémon (siempre en minúsculas).
   * @example 'pikachu'
   */
  @ApiProperty({
    description: 'Nombre del Pokémon',
    example: 'pikachu',
  })
  name: string;

  /**
   * Array de tipos del Pokémon (puede tener 1 o 2).
   * @example ['electric']
   * @example ['fire', 'flying']
   */
  @ApiProperty({
    description: 'Tipos elementales del Pokémon',
    example: ['electric'],
    type: [String],
  })
  types: string[];

  /**
   * URL de la imagen principal (sprite frontal).
   * @example 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
   */
  @ApiProperty({
    description: 'URL de la imagen del Pokémon',
    example:
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    nullable: true,
  })
  image: string | null;

  /**
   * Precio aleatorio generado por el backend (en CLP u otra moneda).
   * @example 4523
   */
  @ApiProperty({
    description: 'Precio aleatorio del Pokémon (generado por backend)',
    example: 4523,
    minimum: 1000,
    maximum: 10000,
  })
  price: number;
}
