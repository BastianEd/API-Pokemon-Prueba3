import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  // El payload es lo que guardaste en auth.service.ts: { email, sub, role }
  async validate(payload: any) {
    // Lo que retornes aquí es lo que se inyecta en request.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role // <--- ¡ESTO FALTABA! Sin esto, el Guard no ve el rol.
    };
  }
}
