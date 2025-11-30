import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

/**
 * Nivel de documentación: Semi-senior
 * * Mock del AuthService.
 * Simulamos solo los métodos públicos que el controlador necesita.
 * Esto aísla el test del controlador de la lógica compleja (bcrypt, JWT) del servicio.
 */
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: typeof mockAuthService;

  // Configuración inicial antes de cada test
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      // Si tu controlador usa Guards (ej: @UseGuards(AuthGuard)),
      // aquí podrías sobrescribirlos si fuera necesario para tests unitarios.
      // .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);

    // Limpiamos los mocks para asegurar que un test no afecte a otro
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: REGISTRO DE USUARIOS
  // ═══════════════════════════════════════════════════════════════
  describe('register', () => {
    it('debe llamar al servicio de registro y retornar el usuario creado', async () => {
      // 1. Arrange (Preparar datos)
      const registerDto: RegisterAuthDto = {
        name: 'Ash Ketchum',
        email: 'ash@pokeapi.co',
        password: 'pikachupassword',
      };

      const expectedResult = {
        message: 'Usuario creado exitosamente',
        user: { name: registerDto.name, email: registerDto.email },
      };

      // Simulamos que el servicio responde correctamente
      service.register.mockResolvedValue(expectedResult);

      // 2. Act (Ejecutar metodo)
      const result = await controller.register(registerDto);

      // 3. Assert (Verificar resultado)
      expect(service.register).toHaveBeenCalledWith(registerDto); // Verifica que se llamó con los datos correctos
      expect(result).toEqual(expectedResult); // Verifica la respuesta
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TEST: LOGIN DE USUARIOS
  // ═══════════════════════════════════════════════════════════════
  describe('login', () => {
    it('debe llamar al servicio de login y retornar el token', async () => {
      // 1. Arrange
      const loginDto: LoginAuthDto = {
        email: 'ash@pokeapi.co',
        password: 'pikachupassword',
      };

      const expectedResult = {
        access_token: 'mock_jwt_token_xyz',
        user: {
          id: '1',
          name: 'Ash Ketchum',
          email: 'ash@pokeapi.co',
          roles: ['user'],
        },
      };

      // Simulamos respuesta exitosa del servicio
      service.login.mockResolvedValue(expectedResult);

      // 2. Act
      const result = await controller.login(loginDto);

      // 3. Assert
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });

    // Nota: Los casos de error (401, 400) se prueban principalmente en el AuthService.
    // El controlador solo propaga la excepción, por lo que un test unitario aquí
    // solo confirmaría que la excepción "sube", lo cual es comportamiento por defecto de NestJS.
  });
});
