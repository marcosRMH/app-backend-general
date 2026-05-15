import { Config } from '@domain/entities/config.entity';

export interface ConfigRepository {
  findById(id: string): Promise<any>;
}
