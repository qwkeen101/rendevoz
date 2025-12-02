import { PrimitiveAtom, createStore } from 'jotai'
import { useAtomValue } from 'jotai'
import { useEffect, useMemo, useState, useRef } from 'react'
import { applyQuery, extractQueryFields, stableStringify } from '../core/query'
import { getVersionSnapshot, globalStore } from '../core/BaseStore'
import { FindManyOptions, IStore, StoreKey } from '../core/types'

type UseFindManyResult<T> = {
    data: T[]
    loading: boolean
    error?: Error
    refetch: () => Promise<T[]>
    isStale: boolean
}

export function createUseFindMany<T>(
    objectMapAtom: PrimitiveAtom<Map<StoreKey, T>>,
    store: IStore<T>,
    jotaiStore?: ReturnType<typeof createStore>
) {
    const actualStore = jotaiStore || globalStore

    return function useFindMany(options?: FindManyOptions<T>): UseFindManyResult<T> {
        const map = useAtomValue(objectMapAtom, { store: actualStore })

        const queryKey = useMemo(() => stableStringify(options || {}), [options])
        const fields = useMemo(() => extractQueryFields(options), [queryKey])
        const fieldsKey = useMemo(() => versionKey(fields), [fields])

        // 🔥 Only track version for fields used in query (not global version)
        const relevantVersion = useMemo(() => getVersionSnapshot(objectMapAtom, fields), [objectMapAtom, fieldsKey])

        const [loading, setLoading] = useState(true)
        const [error, setError] = useState<Error | undefined>(undefined)
        const [isStale, setIsStale] = useState(false)

        // 🔥 Result cache to avoid recomputing identical queries
        const resultCache = useRef<{
            relevantVersion: number
            queryKey: string
            result: T[]
        }>()

        const data = useMemo(() => {
            // Cache hit: version and query haven't changed
            if (resultCache.current?.relevantVersion === relevantVersion &&
                resultCache.current?.queryKey === queryKey) {
                return resultCache.current.result
            }

            // Cache miss: recompute
            const arr = Array.from(map.values()) as T[]
            const result = applyQuery(arr as any, options) as T[]

            // Update cache
            resultCache.current = {
                relevantVersion,
                queryKey,
                result
            }

            return result
        }, [relevantVersion, queryKey])

        useEffect(() => {
            let cancelled = false
            if (!store.findMany) {
                setLoading(false)
                return
            }
            setError(undefined)
            setLoading(true)
            setIsStale(false)
            store.findMany(options).then(() => {
                if (cancelled) return
                setLoading(false)
            }).catch(err => {
                if (cancelled) return
                setError(err instanceof Error ? err : new Error(String(err)))
                setLoading(false)
                setIsStale(true)
            })
            return () => { cancelled = true }
        }, [queryKey, store])

        const refetch = () => {
            if (!store.findMany) return Promise.resolve(data)
            setIsStale(false)
            setLoading(true)
            return store.findMany(options)
                .then(res => {
                    setLoading(false)
                    return res
                })
                .catch(err => {
                    setLoading(false)
                    setError(err instanceof Error ? err : new Error(String(err)))
                    setIsStale(true)
                    return data
                })
        }

        return { data, loading, error, refetch, isStale }
    }
}

// simple deterministic key for fields array
const versionKey = (fields: string[]) => fields.slice().sort().join('|')
