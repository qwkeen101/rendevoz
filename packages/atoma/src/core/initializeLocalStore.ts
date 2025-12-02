import { PrimitiveAtom } from 'jotai'
import { BaseStore, bumpAtomVersion, globalStore } from './BaseStore'
import { applyQuery } from './query'
import { IAdapter, FindManyOptions, IStore, LifecycleHooks, PartialWithId, SchemaValidator, StoreConfig, StoreKey, StoreOperationOptions } from './types'

type GetOneTask = {
    id: StoreKey
    resolve: (value: any) => void
}

/**
 * Initialize a local store with an adapter
 */
/**
 * Initialize a local store with an adapter
 */
export function initializeLocalStore<T>(
    atom: PrimitiveAtom<Map<StoreKey, T>>,
    adapter: IAdapter<T>,
    config?: StoreConfig<T>
): IStore<T> {
    // Use custom store or global store
    const jotaiStore = config?.store || globalStore

    let batchGetOneTaskQueue: GetOneTask[] = []
    let batchFetchOneTaskQueue: GetOneTask[] = []
    const indexDefs = config?.indexes || []
    type FieldIndex = Map<any, Set<StoreKey>>
    const indexMaps = new Map<string, FieldIndex>()

    const getFieldIndex = (field: string): FieldIndex => {
        if (!indexMaps.has(field)) {
            indexMaps.set(field, new Map<any, Set<StoreKey>>())
        }
        return indexMaps.get(field)!
    }

    const matchesIndexedCondition = (value: any, cond: any): boolean => {
        if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
            const { in: inArr, gt, gte, lt, lte, contains } = cond as any
            if (inArr && Array.isArray(inArr)) {
                if (!inArr.some(v => v === value)) return false
            }
            if (gt !== undefined && !(value > gt)) return false
            if (gte !== undefined && !(value >= gte)) return false
            if (lt !== undefined && !(value < lt)) return false
            if (lte !== undefined && !(value <= lte)) return false
            if (contains !== undefined) {
                // contains 用于字符串匹配，索引层不处理子串，直接判等/包含
                if (value === undefined || value === null) return false
                if (!String(value).toLowerCase().includes(String(contains).toLowerCase())) return false
            }
            return true
        }
        return value === cond
    }

    const addToIndex = (item: T) => {
        indexDefs.forEach(field => {
            const val = (item as any)[field]
            if (val === undefined) return
            const fieldMap = getFieldIndex(field)
            const set = fieldMap.get(val) || new Set<StoreKey>()
            set.add((item as any).id as StoreKey)
            fieldMap.set(val, set)
        })
    }

    const removeFromIndex = (item: T | undefined) => {
        if (!item) return
        indexDefs.forEach(field => {
            const val = (item as any)[field]
            if (val === undefined) return
            const fieldMap = indexMaps.get(field)
            if (!fieldMap) return
            const set = fieldMap.get(val)
            if (set) {
                set.delete((item as any).id as StoreKey)
                if (set.size === 0) {
                    fieldMap.delete(val)
                } else {
                    fieldMap.set(val, set)
                }
            }
            if (fieldMap.size === 0) {
                indexMaps.delete(field)
            } else {
                indexMaps.set(field, fieldMap)
            }
        })
    }

    const rebuildIndexesFromMap = () => {
        indexMaps.clear()
        jotaiStore.get(atom).forEach((value) => addToIndex(value as any))
    }

    // Helper to transform data if configured
    const transform = (item: T): T => {
        return config?.transformData ? config.transformData(item) : item
    }

    const validateWithSchema = async (item: T, schema?: SchemaValidator<T>): Promise<T> => {
        if (!schema) return item
        try {
            // Zod safeParse
            if ((schema as any).safeParse) {
                const result = (schema as any).safeParse(item)
                if (!result.success) {
                    throw new Error((result.error || 'Schema validation failed') as any)
                }
                return result.data as T
            }
            // Zod parse
            if ((schema as any).parse) {
                return (schema as any).parse(item)
            }
            // Yup validateSync
            if ((schema as any).validateSync) {
                return (schema as any).validateSync(item)
            }
            // Yup validate (async)
            if ((schema as any).validate) {
                return await (schema as any).validate(item)
            }
            // Function validator
            if (typeof schema === 'function') {
                return await (schema as any)(item)
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            throw err
        }
        return item
    }

    const hooks: LifecycleHooks<T> | undefined = config?.hooks

    const runBeforeSave = async (item: PartialWithId<T>, action: 'add' | 'update') => {
        if (hooks?.beforeSave) {
            return await hooks.beforeSave({ action, item })
        }
        return item
    }

    const runAfterSave = async (item: PartialWithId<T>, action: 'add' | 'update') => {
        if (hooks?.afterSave) {
            await hooks.afterSave({ action, item })
        }
    }

    // Process batched getOne requests
    const processGetOneTaskQueue = async () => {
        if (batchGetOneTaskQueue.length) {
            const sliced = batchGetOneTaskQueue.slice()
            batchGetOneTaskQueue = []

            const ids = Array.from(new Set(sliced.map(i => i.id)).values())
            let items = (await adapter.bulkGet(ids)).filter((i): i is T => i !== undefined)

            // Apply transformation
            items = items.map(transform)

            const idToItem = Object.fromEntries(items.map(i => [(i as any).id, i]))

            sliced.forEach(task => {
                const item = idToItem[task.id]
                task.resolve(item)
            })

            // Update atom cache
            jotaiStore.set(atom, BaseStore.bulkAdd(items as PartialWithId<T>[], jotaiStore.get(atom)))
            rebuildIndexesFromMap()
            bumpAtomVersion(atom)
        }
    }

    // Process batched fetchOne requests (bypass cache)
    const processFetchOneTaskQueue = async () => {
        if (batchFetchOneTaskQueue.length) {
            const sliced = batchFetchOneTaskQueue.slice()
            batchFetchOneTaskQueue = []

            const ids = Array.from(new Set(sliced.map(i => i.id)).values())
            let items = (await adapter.bulkGet(ids)).filter((i): i is T => i !== undefined)

            // Apply transformation
            items = items.map(transform)

            const idToItem = Object.fromEntries(items.map(i => [(i as any).id, i]))

            sliced.forEach(task => {
                const item = idToItem[task.id]
                task.resolve(item)
            })
        }
    }

    // Batch getOne calls
    const handleGetOne = async (id: StoreKey, resolve: (v: T | undefined) => void) => {
        if (batchGetOneTaskQueue.length) {
            batchGetOneTaskQueue.push({ resolve, id })
        } else {
            batchGetOneTaskQueue = [{ resolve, id }]
            Promise.resolve().then(() => {
                processGetOneTaskQueue()
            })
        }
    }

    // Batch fetchOne calls
    const handleFetchOne = async (id: StoreKey, resolve: (v: T | undefined) => void) => {
        if (batchFetchOneTaskQueue.length) {
            batchFetchOneTaskQueue.push({ resolve, id })
        } else {
            batchFetchOneTaskQueue = [{ resolve, id }]
            Promise.resolve().then(() => {
                processFetchOneTaskQueue()
            })
        }
    }

    const store: IStore<T> = {
        addOne: (obj, options) => {
            return new Promise((resolve, reject) => {
                const prepare = async () => {
                    let initedObj = BaseStore.initBaseObject(obj, config?.idGenerator) as unknown as PartialWithId<T>
                    initedObj = await runBeforeSave(initedObj, 'add')
                    initedObj = transform(initedObj as T) as unknown as PartialWithId<T>
                    initedObj = await validateWithSchema(initedObj as T, config?.schema) as unknown as PartialWithId<T>
                    return initedObj
                }

                prepare().then(validObj => {
                    BaseStore.dispatch<T>({
                        type: 'add',
                        data: validObj as PartialWithId<T>,
                        adapter,
                        atom,
                        store: jotaiStore,
                        onSuccess: async o => {
                            await runAfterSave(validObj, 'add')
                            addToIndex(validObj as any)
                            resolve(o)
                        },
                        onFail: (error) => {
                            reject(error || new Error(`Failed to add item with id ${(validObj as any).id}`))
                        }
                    })
                }).catch(reject)
            })
        },

        deleteOneById: (id, options) => {
            return new Promise((resolve, reject) => {
                const oldItem = jotaiStore.get(atom).get(id)
                BaseStore.dispatch({
                    type: options?.force ? 'forceRemove' : 'remove',
                    data: { id } as PartialWithId<T>,
                    adapter,
                    atom,
                    store: jotaiStore,
                    clearCache: options?.clearCache,
                    onSuccess: () => {
                        removeFromIndex(oldItem as any)
                        resolve(true)
                    },
                    onFail: (error) => {
                        reject(error || new Error(`Failed to delete item with id ${id}`))
                    }
                })
            })
        },

        getAll: async (filter, cacheFilter) => {
            let arr = await adapter.getAll(filter)

            // Apply transformation
            arr = arr.map(transform)

            // Apply cache filter if provided
            if (cacheFilter) {
                const itemsToCache = arr.filter(cacheFilter)
                jotaiStore.set(atom, BaseStore.bulkAdd(itemsToCache as PartialWithId<T>[], jotaiStore.get(atom)))
            } else {
                jotaiStore.set(atom, BaseStore.bulkAdd(arr as PartialWithId<T>[], jotaiStore.get(atom)))
            }
            bumpAtomVersion(atom)

            return arr
        },

        getMultipleByIds: async (ids, cache = true) => {
            const map = jotaiStore.get(atom)
            const allInCache = ids.every(id => map.has(id))

            if (allInCache) {
                return ids.map(id => map.get(id)!)
            }

            let arr = (await adapter.bulkGet(ids)).filter((i): i is T => i !== undefined)

            // Apply transformation
            arr = arr.map(transform)

            if (cache) {
                if (arr.some(i => !map.has((i as any).id))) {
                    jotaiStore.set(atom, BaseStore.bulkAdd(arr as PartialWithId<T>[], jotaiStore.get(atom)))
                    bumpAtomVersion(atom)
                }
            }

            return arr
        },

        getOneById: (id) => {
            return new Promise(resolve => {
                const atomOne = jotaiStore.get(atom).get(id)
                if (atomOne) {
                    resolve(atomOne)
                } else {
                    handleGetOne(id, resolve)
                }
            })
        },

        fetchOneById: id => {
            return new Promise(resolve => {
                handleFetchOne(id, resolve)
            })
        },

        updateOne: (obj, options) => {
            return new Promise((resolve, reject) => {
                if (jotaiStore.get(atom).has(obj.id)) {
                    const base = jotaiStore.get(atom).get(obj.id)! as unknown as PartialWithId<T>
                    const prepare = async () => {
                        let merged = Object.assign({}, base, obj, { updatedAt: Date.now(), createdAt: (base as any).createdAt ?? Date.now(), id: obj.id }) as PartialWithId<T>
                        merged = await runBeforeSave(merged, 'update')
                        merged = transform(merged as T) as unknown as PartialWithId<T>
                        merged = await validateWithSchema(merged as T, config?.schema) as unknown as PartialWithId<T>
                        return merged
                    }

                    prepare().then(validObj => {
                        BaseStore.dispatch({
                            type: 'update',
                            atom,
                            adapter,
                            data: validObj,
                            store: jotaiStore,
                            onSuccess: async updated => {
                                await runAfterSave(validObj, 'update')
                                removeFromIndex(base as any)
                                addToIndex(validObj as any)
                                resolve(updated)
                            },
                            onFail: (error) => {
                                reject(error || new Error(`Failed to update item with id ${obj.id}`))
                            }
                        })
                    }).catch(reject)
                } else {
                    // Fetch from adapter first
                    adapter.get(obj.id).then(data => {
                        if (data) {
                            // Transform and validate fetched data before caching
                            const transformed = transform(data)

                            validateWithSchema(transformed, config?.schema)
                                .then(validFetched => {
                                    jotaiStore.set(atom, BaseStore.add(validFetched as PartialWithId<T>, jotaiStore.get(atom)))
                                    addToIndex(validFetched as any)
                                    bumpAtomVersion(atom)

                                    const prepare = async () => {
                                        const base = validFetched as unknown as PartialWithId<T>
                                        let merged = Object.assign({}, base, obj, { updatedAt: Date.now(), createdAt: (base as any).createdAt ?? Date.now(), id: obj.id }) as PartialWithId<T>
                                        merged = await runBeforeSave(merged, 'update')
                                        merged = transform(merged as T) as unknown as PartialWithId<T>
                                        merged = await validateWithSchema(merged as T, config?.schema) as unknown as PartialWithId<T>
                                        return merged
                                    }

                                    prepare().then(validObj => {
                                        BaseStore.dispatch({
                                            type: 'update',
                                            data: validObj,
                                            atom,
                                            adapter,
                                            store: jotaiStore,
                                            onSuccess: async updated => {
                                                await runAfterSave(validObj, 'update')
                                                resolve(updated)
                                            },
                                            onFail: (error) => {
                                                reject(error || new Error(`Failed to update item with id ${obj.id}`))
                                            }
                                        })
                                    }).catch(reject)
                                })
                                .catch(err => reject(err))
                        } else {
                            reject(new Error(`Item with id ${obj.id} not found`))
                        }
                    }).catch(error => {
                        reject(error)
                    })
                }
            })
        },

        findMany: async (options?: FindManyOptions<T>) => {
            // Compute from current cache for即时 UI
            const map = jotaiStore.get(atom)

            // Simple query planner: pick the smallest candidate set from available indexes
            const pickIndexedCandidates = (): Set<StoreKey> | undefined => {
                const where = options?.where
                if (!where) return undefined
                const entries = Object.entries(where as any)
                let best: { ids: Set<StoreKey>, size: number } | undefined

                entries.forEach(([field, cond]) => {
                    const fieldMap = indexMaps.get(field)
                    if (!fieldMap || fieldMap.size === 0) return

                    const collect = (): Set<StoreKey> | undefined => {
                        // in array
                        if (cond && typeof cond === 'object' && !Array.isArray(cond) && (cond as any).in) {
                            const vals = (cond as any).in as any[]
                            const merged = new Set<StoreKey>()
                            vals.forEach(v => {
                                const set = fieldMap.get(v)
                                if (set) set.forEach(k => merged.add(k))
                            })
                            return merged
                        }

                        // eq / range
                        const ids = new Set<StoreKey>()
                        fieldMap.forEach((set, value) => {
                            if (matchesIndexedCondition(value, cond)) {
                                set.forEach(id => ids.add(id))
                            }
                        })
                        return ids
                    }

                    const ids = collect()
                    if (!ids || ids.size === 0) return
                    if (!best || ids.size < best.size) {
                        best = { ids, size: ids.size }
                    }
                })

                return best?.ids
            }

            const candidateIds = pickIndexedCandidates()
            const source = candidateIds ? Array.from(candidateIds).map(id => map.get(id) as T).filter(Boolean) : Array.from(map.values()) as T[]
            const localResult = applyQuery(source, options)

            try {
                let remote = await adapter.getAll(options?.where as any)
                remote = remote.map(transform)
                jotaiStore.set(atom, BaseStore.bulkAdd(remote as PartialWithId<T>[], jotaiStore.get(atom)))
                rebuildIndexesFromMap()
                bumpAtomVersion(atom)
                return applyQuery(remote, options)
            } catch (error) {
                adapter.onError?.(error as Error, 'findMany')
                return localResult
            }
        }
    }

    return store
}
