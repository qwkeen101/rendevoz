export const assignProperties = <T extends object>(
  object: T,
  properties: Partial<T>
) => {
  Object.assign(object, properties);
};
