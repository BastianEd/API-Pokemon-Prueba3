import { SetMetadata } from '@nestjs/common';
export const META_ROLES = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(META_ROLES, roles);
