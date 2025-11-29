import { debounce } from 'lodash'

const getToken = debounce(
  async () => {
    authCu.token = await fetch('https://edge.microsoft.com/translate/auth').then(res => res.text())
  },
  1000,
  {
    leading: true
  }
)

const authCu = {
  token: '',
  fetched: Date.now()
}

export default async (query: string, target: string) => {
  await getToken()
  const result = await fetch(
    `https://api-edge.cognitive.microsofttranslator.com/translate?from=&to=${target}&api-version=3.0&includeSentenceLength=true`,
    {
      method: 'POST',
      body: JSON.stringify([{ Text: query }]),
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${authCu.token}`
      }
    }
  ).then(res => res.json())
  return result[0].translations[0].text as string
}
