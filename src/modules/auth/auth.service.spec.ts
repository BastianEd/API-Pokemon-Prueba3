/**
 * @fileoverview Este archivo contiene las pruebas unitarias para el `AuthService`.
 *
 * @description
 * Las pruebas se centran en verificar la correcta implementación de la lógica de autenticación,
 * asegurando que el servicio se comporte como se espera en diferentes escenarios.
 * Se utilizan mocks para aislar el servicio de sus dependencias (`UserRepository`, `JwtService`, `bcrypt`),
 * permitiendo pruebas unitarias predecibles y enfocadas en la lógica del servicio.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto';

// Mockeamos bcrypt para controlar su comportamiento en las pruebas sin depender de la implementación real.
jest.mock('bcrypt');

// Mock del repositorio de usuarios para simular el acceso a la base de datos.
const mockUserRepository = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

// Mock del servicio JWT para simular la creación de tokens.
const mockJwtService = {
  sign: jest.fn(),
};

/**
 * @describe Bloque de pruebas para `AuthService`.
 *
 * @description
 * Este conjunto de pruebas valida la funcionalidad del `AuthService`,
 * asegurando que cada metodo se comporte como se espera. La configuración `beforeEach`
 * establece un entorno de pruebas limpio para cada caso, reiniciando mocks y
 * reconstruyendo el módulo de NestJS.
 */
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: typeof mockUserRepository;
  let jwtService: typeof mockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);

    // Limpiamos todos los mocks antes de cada prueba para evitar efectos secundarios.
    jest.clearAllMocks();
    // Suprimimos los logs de la aplicación durante las pruebas.
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  /**
   * @describe Pruebas para el metodo `login`.
   *
   * @description
   * Este bloque se enfoca en el metodo `login`, cubriendo los escenarios de éxito y de fallo.
   */
  describe('login', () => {
    const loginDto: LoginAuthDto = { email: 'test@test.com', password: '123' };
    // Objeto tipado parcial para el usuario mockeado
    const mockUser = {
      id: 'uuid-123',
      email: 'test@test.com',
      password: 'hashedPassword',
      name: 'User Test',
      role: 'user',
    } as User;

    /**
     * @it Caso de éxito: debe retornar un token y los datos del usuario si las credenciales son válidas.
     *
     * @description
     * Esta prueba simula un escenario donde el usuario existe y la contraseña proporcionada es correcta.
     * Se verifica que el servicio genere y devuelva un `access_token` junto con la información
     * esencial del usuario.
     */
    it('debe retornar token si las credenciales son válidas', async () => {
      // 1. Mock: El usuario es encontrado en la base de datos.
      userRepository.findOne.mockResolvedValue(mockUser);

      // 2. Mock: La comparación de contraseñas es exitosa.
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // 3. Mock: La firma del token JWT devuelve un valor predecible.
      const token = 'mocked_token';
      jwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      // Verificamos que los mocks fueron llamados como se esperaba.
      expect(userRepository.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('123', 'hashedPassword');

      // Verificamos que la estructura y contenido del resultado sean los correctos.
      expect(result).toEqual({
        access_token: token,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          roles: [mockUser.role],
        },
      });
    });

    /**
     * @it Caso de fallo: debe lanzar `UnauthorizedException` si el usuario no existe.
     *
     * @description
     * Esta prueba asegura que si un usuario intenta iniciar sesión con un email que no está
     * registrado, el servicio rechaza la solicitud con una excepción de no autorizado.
     */
    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      // Simulamos que el usuario no es encontrado.
      userRepository.findOne.mockResolvedValue(null);

      // Verificamos que la promesa sea rechazada con la excepción correcta.
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    /**
     * @it Caso de fallo: debe lanzar `UnauthorizedException` si la contraseña es incorrecta.
     *
     * @description
     * Esta prueba verifica que, incluso si el usuario existe, una contraseña incorrecta
     * resultará en una `UnauthorizedException`, protegiendo la cuenta de accesos no autorizados.
     */
    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      // El usuario existe, pero la contraseña no coincidirá.
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Verificamos que se lance la excepción esperada.
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
