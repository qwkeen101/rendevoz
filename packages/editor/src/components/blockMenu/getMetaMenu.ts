import { IMenuLayoutItem } from '@/components/base/menu'

export default (_editor: any, _instance: any): IMenuLayoutItem[] => {
  return [
    {
      type: 'item',
      text: 'Meta action',
      key: 'meta-placeholder'
    }
  ]
}
