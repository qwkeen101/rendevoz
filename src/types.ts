export type PaginationParams = {
  limit?: number;
  offset?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
};
export type Position = {
  top?: number;
  left?: number;
  x?: number;
  y?: number;
};
export type Rect = {
  width: number;
  height: number;
  left: number;
  top: number;
};
export type PartialWithId<T> = Partial<T> & { id: number };
