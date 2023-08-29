import { IRendevoz } from '~/typings'

export type IGlobalUtilsInstance = Partial<{
  upload: IRendevoz['Actions']['Utils']['uploadFile']
}>
