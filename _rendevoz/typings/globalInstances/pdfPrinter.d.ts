import { Descendant } from 'slate'

type Printable = {
  type: 'note'
  value: Descendant[]
  title: string
}

export type IGlobalPdfPrinterInstance = Partial<{
  print: (printable: Printable) => void
}>
