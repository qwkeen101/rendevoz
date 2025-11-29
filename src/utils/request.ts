import axiosClient from '@/config/axiosClient'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import Id from './id'
import errorCodeToTrans from '@/api/services/errorCodeToTrans'
import toast from 'react-hot-toast'
import { t } from 'i18next'
import trans from '@/consts/trans'
import { debounce } from 'lodash'
type RequestMethod = <T = any>(
  url: string,
  options?: AxiosRequestConfig<any> & {
    toast?: boolean
  }
) => Promise<AxiosResponse<T>>

const debounceToast = debounce(
  (message: string) => {
    toast.error(message)
  },
  500,
  {
    leading: true
  }
)
const request: RequestMethod = async (url, options) => {
  try {
    const res = await axiosClient({
      ...options,
      url: url,
      headers: {
        'x-apigw-nonce': Id.getStrId(),
        ...options?.headers
      }
    })
    if (res.data.status === 'ERROR') {
      const errorCode = res.data.code
      if (errorCodeToTrans[errorCode]) {
        if (options?.toast !== false) {
          debounceToast(t(errorCodeToTrans[errorCode]))
        }
        return Promise.reject()
      }
      return Promise.reject()
    }
    return res
  } catch (e) {
    console.log(e)
    if (!(e && typeof e === 'object' && 'message' in e && e.message === 'canceled')) {
      if (options?.toast !== false) {
        debounceToast(t(trans.Errors.NetworkError))
      }
    }
    return Promise.reject()
  }
}

export { request }
