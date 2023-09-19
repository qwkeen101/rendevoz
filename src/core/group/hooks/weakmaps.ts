import { IGroupInstance, MetaGroupChild } from '~/typings'
import { Path } from 'slate'

export const PATH_TO_ELEMENT_MAP = new WeakMap<IGroupInstance, Map<string, MetaGroupChild>>()

const ID_TO_PATH_MAP = new WeakMap<IGroupInstance, Map<number, Path>>()

const ID_TO_VALUE_MAP = new WeakMap<IGroupInstance, Map<number, MetaGroupChild>>()

const VALUE_TO_PARENT_MAP = new WeakMap<IGroupInstance, Map<number, MetaGroupChild>>()

const findElementByPath = (path: number[], instance: IGroupInstance): MetaGroupChild | undefined => {
  return PATH_TO_ELEMENT_MAP.get(instance)?.get(path.join(','))
}

export const Group = {
  findElementByPath,
  ID_TO_PATH_MAP,
  ID_TO_VALUE_MAP,
  VALUE_TO_PARENT_MAP
}
