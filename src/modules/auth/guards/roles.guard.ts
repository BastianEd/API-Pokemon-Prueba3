import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { META_ROLES } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // La siguiente línea se reformateó para cumplir con las reglas de Prettier.
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      META_ROLES,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    // Se agrega un tipo explícito a 'user' para solucionar los errores de 'any' de ESLint.
    // Asumimos que el objeto 'user' en la solicitud (si existe) tiene una propiedad 'role'.
    const { user }: { user?: { role: string } } = context
      .switchToHttp()
      .getRequest();

    // Se valida que 'user' y 'user.role' existan antes de usarlos.
    // Esto soluciona el acceso inseguro y el paso de un posible 'undefined' a 'includes'.
    if (!user?.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
