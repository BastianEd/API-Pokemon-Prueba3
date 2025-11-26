import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', unique: true }) // El email no se puede repetir
  email: string;

  @Column({ type: 'varchar', select: false }) // select: false para que NO devuelva la password al hacer consultas por defecto
  password: string;

  // Agregamos el rol. Por defecto será 'user' (usuario normal).
  // Si quieres crear un admin, tendrás que cambiar este valor manualmente en la BD
  // o crear una lógica de registro especial, pero para la tarea esto basta.
  @Column({ type: 'varchar', default: 'user' })
  role: string; // valores esperados: 'admin' | 'user'
  // --------------------

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
