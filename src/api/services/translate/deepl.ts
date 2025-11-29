const APIKey = ''
export default async (query: string, target: string) => {
  const url = 'https://api.deepl.com/v2/translate'
  const res = await fetch(url, {
    headers: {
      Authorization: `DeepL-Auth-Key ${APIKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: [query],
      target_lang: target.toUpperCase()
    })
  }).then(i => i.json())
  return res.translations[0].text
}
