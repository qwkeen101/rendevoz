export default async (query: string, target: string) => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURI(query)}`
  const res = await fetch(url).then(i => i.json())
  return res[0][0][0] as string
}
