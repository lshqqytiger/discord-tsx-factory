export type PartialOf<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
