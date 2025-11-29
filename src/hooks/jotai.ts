import { globalStore } from '@/api/stores'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { Atom } from 'jotai/vanilla'
import { isEqual } from 'lodash'

export const useGlobalAtom: typeof useAtom = (atom: Parameters<typeof useAtom>[0]) => useAtom(atom, { store: globalStore })

export const useGlobalAtomValue: typeof useAtomValue = (atom: Parameters<typeof useAtomValue>[0]) =>
  useAtomValue(atom, { store: globalStore })

export const useGlobalSetAtom: typeof useSetAtom = (atom: Parameters<typeof useSetAtom>[0]) => useSetAtom(atom, { store: globalStore })

export const useSelectAtomValue = <T, Slice>(
  atom: Atom<T>,
  selector: (v: T) => Slice,
  options?: Parameters<typeof useAtomValue>[1] & {
    compare?: (prev: Slice, curr: Slice) => boolean
  }
): Slice =>
  useAtomValue(
    useMemo(() => selectAtom(atom, selector, options?.compare ?? isEqual), [atom]),
    options
  )

export const useSelectGlobalAtomValue = <T, Slice>(atom: Atom<T>, selector: (v: T) => Slice, dep?: any[]): Slice =>
  useGlobalAtomValue(useMemo(() => selectAtom(atom, selector), [atom, ...(dep || [])]))
