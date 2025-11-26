/**
 * Este archivo define el controlador para gestionar los pokemones.
 * Un controlador en NestJS es responsable de recibir las solicitudes entrantes
 * y devolver las respuestas al cliente.
 */
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
} from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard'; // Ajusta la ruta si es necesario
import { Roles } from '../auth/decorators/roles.decorator'; // Ajusta la ruta si es necesario

/**
 * @ApiTags('Pokemones') agrupa todos los endpoints (las rutas de la API) de este controlador
 * bajo la etiqueta "Pokemones" en la documentación de Swagger.
 * @Controller('pokemones') establece la ruta base para todos los endpoints de este controlador.
 * Por ejemplo, el endpoint de findAllV1 será accesible en /pokemones.
 */
@ApiTags('Pokemones')
@Controller('pokemones')
export class PokemonController {
  /**
   * El constructor se utiliza para la inyección de dependencias.
   * Aquí, estamos inyectando PokemonService, lo que nos permite usar sus métodos
   * dentro de este controlador para interactuar con la base de datos.
   * @param pokemonService Una instancia de PokemonService.
   */
  constructor(private readonly pokemonService: PokemonService) {}

  // --- VERSION 1 DE LA API ---

  /**
   * @Version('1') define que este endpoint pertenece a la versión 1 de la API.
   * @Get() decora el metodo como un handler para peticiones HTTP GET.
   * @ApiOperation es para Swagger, proporciona un resumen de lo que hace el endpoint.
   * Este metodo devuelve una lista simple de todos los pokemones.
   */
  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Obtener lista simple (V1)' })
  findAllV1() {
    return this.pokemonService.findAllBasic();
  }

  /**
   * Este endpoint permite crear un nuevo pokemon.
   * @Version('1') lo asigna a la v1 de la API.
   * @Post() lo define como un handler para peticiones HTTP POST.
   * @UseGuards(AuthGuard('jwt'), RolesGuard) protege la ruta. Primero verifica que el usuario
   * esté autenticado (con un JSON Web Token) y luego comprueba si tiene los roles permitidos.
   * @Roles('admin') especifica que solo los usuarios con el rol 'admin' pueden acceder.
   * @ApiBearerAuth() le indica a Swagger que este endpoint requiere un token de autenticación.
   * @Body() extrae los datos del cuerpo de la petición y los valida usando CreatePokemonDto.
   */
  @Version('1')
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear Pokemon (Admin Only)' })
  create(@Body() createPokemonDto: CreatePokemonDto) {
    return this.pokemonService.create(createPokemonDto);
  }

  // --- VERSION 2 DE LA API ---

  /**
   * Endpoint de la V2 para obtener una lista más detallada de los pokemones.
   */
  @Version('2')
  @Get()
  @ApiOperation({ summary: 'Obtener lista detallada (V2)' })
  findAllV2() {
    return this.pokemonService.findAllDetailed();
  }

  /**
   * Endpoint de la V2 para eliminar un pokemon por su ID.
   * @Delete(':id') lo define como un handler para peticiones HTTP DELETE,
   * donde ':id' es un parámetro en la URL (ej: /pokemones/25).
   * También está protegido para que solo los administradores puedan usarlo.
   * @param id El ID del pokemon a eliminar, extraído de la URL.
   */
  @Version('2')
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar Pokemon (Admin Only)' })
  remove(@Param('id') id: string) {
    // El '+' convierte el 'id' de string a number.
    return this.pokemonService.remove(+id);
  }

  /**
   * Endpoint de la V2 para obtener un pokemon específico por su ID.
   * @Get(':id') captura el ID de la URL.
   * @param id El ID del pokemon a buscar. ParseIntPipe se asegura de que el parámetro
   *           recibido sea un número entero válido.
   */
  @Version('2')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un Pokemon por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.findOne(id);
  }

  /**
   * Endpoint de la V2 para actualizar parcialmente un pokemon.
   * @Patch(':id') lo define como un handler para peticiones HTTP PATCH.
   * Está protegido para que solo los administradores puedan actualizar datos.
   * @param id El ID del pokemon a actualizar.
   * @param updatePokemonDto Los datos a actualizar, validados por UpdatePokemonDto.
   */
  @Version('2')
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar Pokemon' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePokemonDto: UpdatePokemonDto,
  ) {
    return this.pokemonService.update(id, updatePokemonDto);
  }
}
