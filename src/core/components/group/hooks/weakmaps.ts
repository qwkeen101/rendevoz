import { IGroupInstance, MetaGroupChild } from '~/typings'
import { Path } from 'slate'

export const PATH_TO_ELEMENT_MAP = new WeakMap<IGroupInstance, Map<string, MetaGroupChild>>()

const ID_TO_PATH_MAP = new WeakMap<IGroupInstance, Map<number, Path>>()

const ID_TO_VALUE_MAP = new WeakMap<IGroupInstance, Map<number, MetaGroupChild>>()

const ID_TO_FILTER_PATH_MAP = new WeakMap<IGroupInstance, Map<number, Path>>()

const VALUE_TO_PARENT_MAP = new WeakMap<IGroupInstance, Map<number, MetaGroupChild>>()

const ID_TO_GROUP_PATH_MAP = new WeakMap<IGroupInstance, Map<number, Path>>()
export const Group = {
  ID_TO_PATH_MAP,
  ID_TO_VALUE_MAP,
  VALUE_TO_PARENT_MAP,
  ID_TO_FILTER_PATH_MAP,
  ID_TO_GROUP_PATH_MAP
}
