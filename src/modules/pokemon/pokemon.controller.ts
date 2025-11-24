import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Version,
  UseGuards,
} from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport'; // Para proteger rutas

@ApiTags('Pokemones') // Categoría en Swagger
@Controller('pokemones') // Ruta base: /pokemons
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  // --- VERSION 1 ---

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Obtener lista simple (V1)' })
  findAllV1() {
    return this.pokemonService.findAllBasic();
  }

  @Version('1')
  @Post()
  @UseGuards(AuthGuard('jwt')) // Protegido con JWT
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear Pokemon (Admin Only)' })
  create(@Body() createPokemonDto: CreatePokemonDto) {
    return this.pokemonService.create(createPokemonDto);
  }

  // --- VERSION 2 ---

  @Version('2')
  @Get()
  @ApiOperation({ summary: 'Obtener lista detallada (V2)' })
  findAllV2() {
    return this.pokemonService.findAllDetailed();
  }

  @Version('2')
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.pokemonService.remove(+id);
  }
}
