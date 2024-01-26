export const DEFAULT_GROUP_PROPERTIES = [
  {
    name: 'type',
    display: 'general.type',
    icon: 'park-all-application',
    visible: true,
    type: 'basic',
    editable: false,
    id: 1,
    propType: 'metaType'
  },
  {
    name: 'name',
    display: 'general.name',
    icon: 'park-edit',
    visible: true,
    type: 'basic',
    editable: false,
    id: 2,
    propType: 'string',
    width: 300
  },
  {
    name: 'description',
    icon: 'park-info',
    display: 'general.description',
    visible: false,
    propType: 'string',
    type: 'basic',
    editable: false,
    id: 3
  },
  {
    name: 'tags',
    icon: 'park-tag-one',
    display: 'general.tags',
    visible: true,
    type: 'basic',
    editable: false,
    propType: 'multiSelect',
    id: 4
  },
  {
    name: 'coverImgSrc',
    icon: 'park-picture',
    display: 'general.image',
    visible: true,
    type: 'basic',
    editable: false,
    id: 5
  },
  {
    name: 'originalText',
    icon: 'park-info',
    display: 'general.original Text',
    visible: false,
    type: 'basic',
    editable: false,
    id: 6
  },
  {
    name: 'parentItems',
    display: 'general.parent items',
    icon: 'park-chart-graph',
    visible: false,
    type: 'basic',
    editable: false,
    id: 7
  },
  {
    name: 'fromObject',
    icon: 'park-share-one',
    display: 'general.from',
    visible: false,
    type: 'basic',
    editable: false,
    id: 8
  },
  {
    name: 'attachments',
    icon: 'park-link-three',
    display: 'general.attachments',
    visible: false,
    type: 'basic',
    editable: false,
    id: 14
  },
  {
    name: 'labels',
    icon: 'park-label',
    display: 'general.label',
    visible: false,
    type: 'basic',
    editable: false,
    id: 9
  },
  {
    name: 'related',
    display: 'general.related',
    visible: false,
    type: 'basic',
    editable: false,
    id: 10
  },
  {
    name: 'createdAt',
    icon: 'park-time',
    display: 'general.createdAt',
    visible: false,
    type: 'basic',
    propType: 'date',
    editable: false,
    id: 11
  },
  {
    name: 'viewAt',
    icon: 'park-preview-open',
    display: 'general.viewAt',
    visible: false,
    type: 'basic',
    editable: false,
    propType: 'date',
    id: 12
  },
  {
    name: 'updatedAt',
    icon: 'park-redo',
    display: 'general.updatedAt',
    visible: false,
    type: 'basic',
    editable: false,
    propType: 'date',
    id: 13
  }
]

export const DEFAULT_GROUP_PROPERTY_OBJ = Object.fromEntries(DEFAULT_GROUP_PROPERTIES.map(i => [i.id, i]))
