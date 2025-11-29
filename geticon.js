import { readFileSync, writeFileSync } from 'fs'
import fetch from 'node-fetch'
const data = readFileSync('./feed.json', { encoding: 'utf-8' })
const parsed = JSON.parse(data)

Object.entries(parsed).forEach(i => {
  i[1].forEach(async o => {
    delete o['image']
  })
})

writeFileSync('./feed.json', JSON.stringify(parsed))