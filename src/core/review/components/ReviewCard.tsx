// import { ObjectStore } from '@/stores'
// import { model } from '@/core/review/hooks/useReviewInstance'
// import { State } from 'fsrs.js'

// const ReviewCard = ({ reviewId }: { reviewId: number }) => {
//   const review = ObjectStore('review').useValue(reviewId)

//   return (
//     <div
//       onClick={() => {
//         if (review?.card) {
//           const next = model.repeat(review.card, review.card.due)[3]
//           let s = ''
//           switch (next.review_log.state) {
//             case State.New:
//               s = 'new'
//               break
//             case State.Learning:
//               s = 'learing'
//               break
//             case State.Review:
//               s = 'review'
//               break
//             case State.Relearning:
//               s = 'relearning'
//           }
//           console.log(s)
//           ObjectStore('review').updateOne({ id: reviewId, card: next.card })
//         }
//       }}
//     >
//       d: {review?.card.difficulty}, s: {review?.card.stability}
//     </div>
//   )
// }

// export default ReviewCard
