import { useState } from 'react'
import { Intro } from './components/Intro'
import { Quiz } from './components/Quiz'
import { Results } from './components/Results'
import { PERKS } from './data/perks'
import { trackQuizComplete, trackQuizStart } from './lib/analytics'
import { computeTotals, getEligiblePerks, rankPerks } from './lib/eligibility'
import { newestVerifiedOn } from './lib/format'
import type { Perk, Profile } from './lib/types'

type Stage =
  | { name: 'intro' }
  | { name: 'quiz' }
  | { name: 'results'; perks: Perk[]; total: number; recurringPerYear: number }

export default function App() {
  const [stage, setStage] = useState<Stage>({ name: 'intro' })

  const startQuiz = () => {
    trackQuizStart()
    setStage({ name: 'quiz' })
  }

  const completeQuiz = (profile: Profile) => {
    const eligible = getEligiblePerks(profile, PERKS)
    const ranked = rankPerks(eligible, profile)
    const { total, recurringPerYear } = computeTotals(ranked)
    trackQuizComplete(profile, ranked.length, total)
    setStage({ name: 'results', perks: ranked, total, recurringPerYear })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <main>
      {stage.name === 'intro' && (
        <Intro perkCount={PERKS.length} lastReviewed={newestVerifiedOn(PERKS)} onStart={startQuiz} />
      )}
      {stage.name === 'quiz' && <Quiz onComplete={completeQuiz} />}
      {stage.name === 'results' && (
        <Results
          perks={stage.perks}
          total={stage.total}
          recurringPerYear={stage.recurringPerYear}
          onRestart={() => setStage({ name: 'intro' })}
        />
      )}
    </main>
  )
}
