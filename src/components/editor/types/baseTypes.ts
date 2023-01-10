export interface ElementWithId {
  id: number
}
export interface CardElement {
  cardType: 'wide' | 'slim' | 'line' | 'embedded'
}
export interface EmptyText {
  text: string
}
export interface CustomText {
  bold?: boolean
  italic?: boolean
  code?: boolean
  text: string
}
