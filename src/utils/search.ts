import { MeiliSearch } from 'meilisearch'

const MeiliClient = new MeiliSearch({
  host: 'http://127.0.0.1:7700'
})

export const addDocument = async () => {
  const index = MeiliClient.index('movies')
  const documents = [
    { id: 1, title: 'Carol', genres: ['Romance', 'Drama'] },
    { id: 2, title: 'Wonder Woman', genres: ['Action', 'Adventure'] },
    { id: 3, title: 'Life of Pi', genres: ['Adventure', 'Drama'] },
    { id: 4, title: 'Mad Max: Fury Road', genres: ['Adventure', 'Science Fiction'] },
    { id: 5, title: 'Moana', genres: ['Fantasy', 'Action'] },
    { id: 6, title: 'Philadelphia', genres: ['Drama'] }
  ]
  const response = await index.addDocuments(documents)
  console.log(response)
}
export const searchDocument = async () => {
  const index = MeiliClient.index('movies')
  const search = await index.search('philoudelphia')
  console.log(search)
}
