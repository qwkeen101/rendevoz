import { IFileSystem } from '~/typings/fs'
import { S3 } from '@aws-sdk/client-s3'

const endpoint = 'https://s3.cn-south-1.qiniucs.com'
const region = 'cn-south-1'
const ak = '_cm-OEn1VGsVIIi8ZqNePVQOizUsT6W_uTxQ-qyH'
const sk = '56O_cp6EH51dHnkbWqqsjHxg-CrmK6vCKPJ5ger8'
export default {
  writeFile: async (data, path) => {
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    const res = await client.listBuckets({})
    console.log(res)
    // res.Buckets?.forEach(b => {
    //   client
    //     .listObjects({
    //       Bucket: b.Name
    //     })
    //     .then(res => {
    //       res.Contents?.forEach(c => {
    //         client
    //           .getObject({
    //             Key: c.Key,
    //             Bucket: b.Name
    //           })
    //           .then(p => {
    //             console.log(p)
    //           })
    //       })
    //     })
    // })
    return ''
  }
} as IFileSystem
