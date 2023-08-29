import { IMetaTableInstance, MetaGroupChild } from '~/typings'

export const PATH_TO_ELEMENT_MAP = new WeakMap<IMetaTableInstance, Map<string, MetaGroupChild>>()

const findElementByPath = (path: number[], instance: IMetaTableInstance): MetaGroupChild | undefined => {
  return PATH_TO_ELEMENT_MAP.get(instance)?.get(path.join(','))
}

export const Group = {
  findElementByPath
}
