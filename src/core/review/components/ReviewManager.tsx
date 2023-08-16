// import { MetaStore, ObjectStore } from '@/stores'
// import { useGlobalAtomValue } from '@/hooks'
// import { useEffect, useMemo } from 'react'
// import ReviewCard from '@/core/review/components/ReviewCard'
// import { FsrsRating, useAssignReviewInstance, useReviewInstance } from '@/core/review/hooks/useReviewInstance'
// import { DateFormat } from '@/utils'
// import HeatMap from '@uiw/react-heat-map'
// import { ObjectTimeline } from '@/core'
// import TimelineManager from '@/core/database/TimelineManager'

// const ReviewManager = () => {
//   const reviewStore = ObjectStore('review')
//   useEffect(() => {
//     reviewStore.getAll()
//   }, [])
//   const instance = useReviewInstance()
//   useAssignReviewInstance()
//   const allReviews = useGlobalAtomValue(reviewStore.objectMapAtom)
//   const allMetas = MetaStore.useMetaObjectsMap()

//   const grouped = useMemo(() => {
//     const normalizedToDayCreate: Record<string, number> = {}
//     Array.from(allMetas.values()).forEach(i => {
//       const create = i.createdAt
//       const res = DateFormat.format(create, 'y/MM/dd')
//       const current = (normalizedToDayCreate[res] || 0) + 1
//       normalizedToDayCreate[res] = current
//     })
//     const value = []
//     Object.keys(normalizedToDayCreate).forEach(k => {
//       value.push({
//         date: k,
//         value: normalizedToDayCreate[k]
//       })
//     })
//     return value
//   }, [allMetas])

//   console.log(grouped)
//   return (
//     <div style={{ height: '100%', overflow: 'auto', display: 'flex' }}>
//       <TimelineManager />
//     </div>
//   )
// }

// export default ReviewManager
