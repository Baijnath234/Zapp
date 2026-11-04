import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('tv_settings')
export class SettingEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

