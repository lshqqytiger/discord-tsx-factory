export type Wrapper = (original: Function) => Function;
export function wrap(prototype: any, method: string, wrapper: Wrapper) {
  const _method = prototype[method];
  prototype[method] = wrapper(_method);
}
