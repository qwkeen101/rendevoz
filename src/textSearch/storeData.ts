import { Orama, save } from '@orama/orama'
import { saveBlobLocally } from '@/utils'

const storeSearchIndexLocally = async (oramaInstance: Orama<any>) => {
  const jsonIndex = await save(oramaInstance)
  console.log(jsonIndex)

}

export default storeSearchIndexLocally
