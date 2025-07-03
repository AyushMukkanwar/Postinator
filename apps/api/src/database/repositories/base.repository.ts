// src/database/repositories/base.repository.ts
export interface BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  create(data: CreateInput): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(params?: {
    skip?: number;
    take?: number;
    where?: WhereInput;
    orderBy?: any;
  }): Promise<T[]>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<T>;
  count(where?: WhereInput): Promise<number>;
}
