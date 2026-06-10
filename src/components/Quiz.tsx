import { useState } from 'react'
import { US_STATES } from '../data/states'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { AgeBracket, Community, Interest, Profile, StudentStatus } from '../lib/types'
import { Chip } from './Chip'

const AGE_OPTIONS: Array<{ value: AgeBracket; label: string }> = [
  { value: 'under18', label: 'Under 18' },
  { value: '18to20', label: '18–20' },
  { value: '21to24', label: '21–24' },
  { value: '25plus', label: '25+' },
]

const STUDENT_OPTIONS: Array<{ value: StudentStatus; label: string }> = [
  { value: 'college', label: 'College student' },
  { value: 'highschool', label: 'High school student' },
  { value: 'none', label: 'Not a student' },
]

const COMMUNITY_OPTIONS: Array<{ value: Community; label: string }> = [
  { value: 'military', label: 'Military or veteran' },
  { value: 'teacher', label: 'Teacher or educator' },
  { value: 'nurse', label: 'Nurse or healthcare' },
  { value: 'responder', label: 'First responder' },
  { value: 'gov', label: 'Government employee' },
]

const INTEREST_OPTIONS: Array<{ value: Interest; label: string }> = [
  { value: 'ai', label: 'AI tools' },
  { value: 'dev', label: 'Coding' },
  { value: 'stream', label: 'Streaming & music' },
  { value: 'create', label: 'Creative tools' },
  { value: 'shop', label: 'Shopping & delivery' },
  { value: 'fit', label: 'Fitness & wellness' },
  { value: 'bet', label: 'Sports betting' },
]

const STEPS = ['age', 'student', 'community', 'state', 'interests'] as const
type Step = (typeof STEPS)[number]

const STEP_TITLES: Record<Step, string> = {
  age: 'How old are you?',
  student: 'Are you a student?',
  community: 'Any of these communities?',
  state: 'Where do you live?',
  interests: 'What do you care about?',
}

const STEP_HINTS: Record<Step, string> = {
  age: 'Some offers are age-gated.',
  student: 'Student status unlocks the biggest discounts.',
  community: 'Pick all that apply — or continue past.',
  state: 'A few offers depend on state law.',
  interests: 'We float what you care about to the top.',
}

type QuizProps = {
  onComplete: (profile: Profile) => void
}

export function Quiz({ onComplete }: QuizProps) {
  const reducedMotion = useReducedMotion()
  const [stepIndex, setStepIndex] = useState(0)
  const [age, setAge] = useState<AgeBracket | null>(null)
  const [student, setStudent] = useState<StudentStatus | null>(null)
  const [communities, setCommunities] = useState<Community[]>([])
  const [state, setState] = useState('')
  const [interests, setInterests] = useState<Interest[]>([])

  const step = STEPS[stepIndex] ?? 'age'

  const advance = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1)
    }
  }

  // Brief pause after a single-select tap so the selection registers visually.
  const advanceSoon = () => {
    if (reducedMotion) advance()
    else setTimeout(advance, 180)
  }

  const finish = () => {
    if (age && student) {
      onComplete({ age, student, communities, state, interests })
    }
  }

  const toggle = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

  return (
    <section className="mx-auto flex min-h-dvh max-w-xl flex-col px-6 py-10">
      <div className="flex items-center justify-between">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={() => setStepIndex(stepIndex - 1)}
            className="text-sm font-medium text-muted hover:text-cream"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        <p className="font-mono text-xs font-bold text-dim" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
          {stepIndex + 1} / {STEPS.length}
        </p>
      </div>

      <div
        className="mt-4 h-0.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label="Quiz progress"
      >
        <div
          className="h-full bg-brass transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div key={step} className="animate-fade mt-12 flex grow flex-col">
        <h2 className="font-display text-3xl font-semibold text-cream">{STEP_TITLES[step]}</h2>
        <p className="mt-2 text-base text-muted">{STEP_HINTS[step]}</p>

        {step === 'age' && (
          <div className="mt-8 flex flex-wrap gap-3">
            {AGE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={age === option.value}
                onClick={() => {
                  setAge(option.value)
                  advanceSoon()
                }}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        )}

        {step === 'student' && (
          <div className="mt-8 flex flex-wrap gap-3">
            {STUDENT_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                selected={student === option.value}
                onClick={() => {
                  setStudent(option.value)
                  advanceSoon()
                }}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        )}

        {step === 'community' && (
          <>
            <div className="mt-8 flex flex-wrap gap-3">
              {COMMUNITY_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  selected={communities.includes(option.value)}
                  onClick={() => setCommunities(toggle(communities, option.value))}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
            <ContinueButton onClick={advance}>
              {communities.length > 0 ? 'Continue' : 'None of these — continue'}
            </ContinueButton>
          </>
        )}

        {step === 'state' && (
          <>
            <label htmlFor="state-select" className="sr-only">
              State
            </label>
            <select
              id="state-select"
              value={state}
              onChange={(event) => setState(event.target.value)}
              className="mt-8 w-full rounded-xl border border-line bg-ink-2 px-4 py-3.5 text-base text-cream focus:border-brass"
            >
              <option value="">Choose a state…</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <ContinueButton onClick={advance}>
              {state ? 'Continue' : 'Skip — continue'}
            </ContinueButton>
          </>
        )}

        {step === 'interests' && (
          <>
            <div className="mt-8 flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  selected={interests.includes(option.value)}
                  onClick={() => setInterests(toggle(interests, option.value))}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
            <ContinueButton onClick={finish} disabled={!age || !student}>
              Open my vault
            </ContinueButton>
          </>
        )}
      </div>
    </section>
  )
}

function ContinueButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mt-10">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="min-h-12 w-full rounded-full bg-brass px-8 py-3 text-lg font-semibold text-ink transition-colors hover:bg-brass-bright disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {children}
      </button>
    </div>
  )
}
