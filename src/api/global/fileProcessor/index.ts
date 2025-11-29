import { MetaObject } from '~/typings'

export type IImportResult<T> = {
  object: Partial<T>
  meta: Partial<MetaObject>
}

export { default as importDocx } from './importDocx'
export { default as importAudio } from './importAudio'
export { default as importHTML } from './importHTML'
export { default as importMarkdown } from './importMarkdown'
export { default as importPDF } from './importPDF'
export { default as importVideo } from './importVideo'
export { default as importImage } from './importImage'
