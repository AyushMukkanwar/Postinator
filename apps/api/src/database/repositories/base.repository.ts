export interface BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereInput,
  OrderByInput = unknown,
> {
  create(data: CreateInput): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(params?: {
    skip?: number;
    take?: number;
    where?: WhereInput;
    orderBy?: OrderByInput;
  }): Promise<T[]>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<T>;
  count(where?: WhereInput): Promise<number>;
}
