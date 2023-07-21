type Printable = {
  type: 'note'
  noteId: number
  title: string
}

export type IGlobalPdfPrinterInstance = Partial<{
  print: (printable: Printable) => void
}>
