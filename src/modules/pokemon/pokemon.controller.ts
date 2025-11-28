import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Version,
  UseGuards,
  Patch,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('pokemones')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  // ═══════════════════════════════════════════════════════════════
  // GRUPO 1: BASE DE DATOS LOCAL
  // ═══════════════════════════════════════════════════════════════

  @ApiTags('Pokemones (BD Local)')
  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Obtener lista simple de Pokémon (BD local)' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAllV1() {
    return this.pokemonService.findAllBasic();
  }

  @ApiTags('Pokemones (BD Local)')
  @Version('1')
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear Pokémon en BD local (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Pokémon creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  create(@Body() createPokemonDto: CreatePokemonDto) {
    return this.pokemonService.create(createPokemonDto);
  }

  @ApiTags('Pokemones (BD Local)')
  @Version('2')
  @Get()
  @ApiOperation({ summary: 'Obtener lista detallada de Pokémon (BD local)' })
  @ApiResponse({ status: 200, description: 'Lista obtenida exitosamente' })
  findAllV2() {
    return this.pokemonService.findAllDetailed();
  }

  @ApiTags('Pokemones (BD Local)')
  @Version('2')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener Pokémon por ID (BD local)' })
  @ApiParam({ name: 'id', description: 'ID del Pokémon', example: 1 })
  @ApiResponse({ status: 200, description: 'Pokémon encontrado' })
  @ApiResponse({ status: 404, description: 'Pokémon no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.findOne(id);
  }

  @ApiTags('Pokemones (BD Local)')
  @Version('2')
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar Pokémon (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del Pokémon' })
  @ApiResponse({ status: 200, description: 'Pokémon actualizado' })
  @ApiResponse({ status: 404, description: 'Pokémon no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePokemonDto: UpdatePokemonDto,
  ) {
    return this.pokemonService.update(id, updatePokemonDto);
  }

  // ═══════════════════════════════════════════════════════════════
  //  DELETE
  // ═══════════════════════════════════════════════════════════════
  @ApiTags('Pokemones (BD Local)')
  @Version('2')
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard) // Protegemos la ruta
  @Roles('admin') // Solo admins pueden borrar
  @ApiBearerAuth() // Icono de candado en Swagger
  @ApiOperation({ summary: 'Eliminar Pokémon (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del Pokémon a eliminar' })
  @ApiResponse({ status: 200, description: 'Pokémon eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pokémon no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.remove(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // GRUPO 2: INTEGRACIÓN POKEAPI
  // ═══════════════════════════════════════════════════════════════

  @ApiTags('Pokemones (Integración PokéAPI)')
  @Version('2')
  @Get('pokeapi/:nameOrId')
  @ApiOperation({
    summary: 'Consultar Pokémon desde PokéAPI (no guarda en BD)',
    description:
      'Obtiene nombre, tipos, imagen y precio aleatorio desde la API externa',
  })
  @ApiParam({ name: 'nameOrId', example: 'pikachu' })
  @ApiResponse({ status: 200, description: 'Pokémon encontrado' })
  getFromPokeApi(@Param('nameOrId') nameOrId: string) {
    return this.pokemonService.getFromPokeApi(nameOrId);
  }

  @ApiTags('Pokemones (Integración PokéAPI)')
  @Version('2')
  @Get('pokeapi/list/all')
  @ApiOperation({ summary: 'Listar Pokémon desde PokéAPI con paginación' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  getListFromPokeApi(@Query('limit') limit = 20, @Query('offset') offset = 0) {
    return this.pokemonService.getListFromPokeApi(+limit, +offset);
  }

  @ApiTags('Pokemones (Integración PokéAPI)')
  @Version('2')
  @Get('pokeapi/type/:type')
  @ApiOperation({ summary: 'Buscar Pokémon por tipo desde PokéAPI' })
  @ApiParam({ name: 'type', example: 'fire' })
  getByTypeFromPokeApi(
    @Param('type') type: string,
    @Query('limit') limit = 20,
  ) {
    return this.pokemonService.getByTypeFromPokeApi(type, +limit);
  }

  @ApiTags('Pokemones (Integración PokéAPI)')
  @Version('2')
  @Post('seed')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Importar múltiples Pokémon desde PokéAPI a BD local (Seed)',
  })
  seedFromPokeApi(@Query('limit') limit = 20) {
    return this.pokemonService.seedFromPokeApi(+limit);
  }

  @ApiTags('Pokemones (Integración PokéAPI)')
  @Version('2')
  @Post('import/:nameOrId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Importar Pokémon específico desde PokéAPI (Solo Admin)',
  })
  importFromPokeApi(@Param('nameOrId') nameOrId: string) {
    return this.pokemonService.importFromPokeApi(nameOrId);
  }
}
