import { CustomElement } from '~/typings'
export default (element: CustomElement) => {
  return element.type === 'metaObject' && element.cardType === 'embeded'
}
