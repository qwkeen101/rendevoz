const authCu = {
  token: '',
  fetched: Date.now()
}

export default async function LocalMicrosoftTranslate(query: { Text: string }[]): Promise<string[]> {
  authCu.token = await fetch('https://edge.microsoft.com/translate/auth').then(res => res.text())

  if (!authCu.token) throw ''
  const result = await fetch(
    'https://api-edge.cognitive.microsofttranslator.com/translate?from=&to=zh-Hans&api-version=3.0&includeSentenceLength=true',
    {
      method: 'POST',
      body: JSON.stringify(query),
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${authCu.token}`
      }
    }
  ).then(res => res.json())
  return result.map(i => i.translations[0].text)
}
