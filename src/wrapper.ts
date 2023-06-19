export type Wrapper = (original: Function) => Function;
export function wrap<T extends string>(
  prototype: { [K in T]: Function },
  method: T,
  wrapper: Wrapper
) {
  const _method = prototype[method];
  prototype[method] = wrapper(_method);
}
