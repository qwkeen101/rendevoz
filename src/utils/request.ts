import axiosClient from "@/config/axiosClient";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import Id from "./id";

type RequestMethod = <T = any>(
  url: string,
  options: AxiosRequestConfig<any>
) => Promise<AxiosResponse<T>>;

const request: RequestMethod = (url, options) => {
  return axiosClient({
    ...options,
    url: url,
    headers: {
      "x-apigw-nonce": Id.getStrId(),
      ...options.headers,
    },
  });
};

export { request };
