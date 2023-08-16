import * as model from 'fsrs.js'
import { State } from 'fsrs.js'

const Rating = model.Rating
const State = model.State

function test_repeat() {
  // let rating = new model.Rating();
  const f = new model.FSRS()
  f.p.w = [1.14, 1.01, 5.44, 14.67, 5.3024, 1.5662, 1.2503, 0.0028, 1.5489, 0.1763, 0.9953, 2.7473, 0.0179, 0.3105, 0.3976, 0.0, 2.0902]
  let card = new model.Card()
  let revlog: model.ReviewLog
  let now = new Date()
  let scheduling_cards = f.repeat(card, now)

  console.log(scheduling_cards)
  const ratings = [
    Rating.Hard,
    Rating.Hard,
    Rating.Hard,
    Rating.Hard,
    Rating.Good,
    Rating.Good,
    Rating.Again,
    Rating.Again,
    Rating.Good,
    Rating.Good,
    Rating.Good,
    Rating.Good,
    Rating.Good
  ]
  const ivl_history = new Array<number>()
  const state_history = new Array<State>()

  for (let i = 0; i < ratings.length; i++) {
    card = scheduling_cards[ratings[i]].card
    ivl_history.push(card.scheduled_days)
    revlog = scheduling_cards[ratings[i]].review_log
    let s = ''
    switch (revlog.state) {
      case State.New:
        s = 'new'
        break
      case State.Learning:
        s = 'learing'
        break
      case State.Review:
        s = 'review'
        break
      case State.Relearning:
        s = 'relearning'
    }
    state_history.push(s)
    now = card.due
    scheduling_cards = f.repeat(card, now)
    console.log(scheduling_cards)
  }

  console.log(ivl_history)
  console.log(state_history)
}

export default test_repeat
