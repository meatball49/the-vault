import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Quiz } from './Quiz'

describe('Quiz', () => {
  it('walks through all five steps and reports the full profile', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Quiz onComplete={onComplete} />)

    // Step 1: age (single-select, auto-advances)
    expect(screen.getByText('How old are you?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '21–24' }))

    // Step 2: student
    expect(await screen.findByText('Are you a student?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'College student' }))

    // Step 3: communities (multi-select)
    expect(await screen.findByText('Any of these communities?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Teacher or educator' }))
    await user.click(screen.getByRole('button', { name: 'Nurse or healthcare' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    // Step 4: state
    await user.selectOptions(screen.getByLabelText('State'), 'NJ')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    // Step 5: interests
    await user.click(screen.getByRole('button', { name: 'AI tools' }))
    await user.click(screen.getByRole('button', { name: 'Sports betting' }))
    await user.click(screen.getByRole('button', { name: 'Open my vault' }))

    expect(onComplete).toHaveBeenCalledWith({
      age: '21to24',
      student: 'college',
      communities: ['teacher', 'nurse'],
      state: 'NJ',
      interests: ['ai', 'bet'],
    })
  })

  it('lets the user skip communities and state', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Quiz onComplete={onComplete} />)

    await user.click(screen.getByRole('button', { name: '25+' }))
    await user.click(await screen.findByRole('button', { name: 'Not a student' }))
    await user.click(await screen.findByRole('button', { name: 'None of these — continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip — continue' }))
    await user.click(screen.getByRole('button', { name: 'Open my vault' }))

    expect(onComplete).toHaveBeenCalledWith({
      age: '25plus',
      student: 'none',
      communities: [],
      state: '',
      interests: [],
    })
  })

  it('supports going back without losing the earlier answer', async () => {
    const user = userEvent.setup()
    render(<Quiz onComplete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Under 18' }))
    expect(await screen.findByText('Are you a student?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '← Back' }))

    expect(screen.getByRole('button', { name: 'Under 18' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('double-tapping a single-select chip never skips a step', async () => {
    const user = userEvent.setup()
    render(<Quiz onComplete={vi.fn()} />)

    // Two fast taps on the same age chip must not jump past the student step.
    const under18 = screen.getByRole('button', { name: 'Under 18' })
    await user.dblClick(under18)

    expect(await screen.findByText('Are you a student?')).toBeInTheDocument()
    // The community step (which would be next if we'd skipped) is not shown.
    expect(screen.queryByText('Any of these communities?')).not.toBeInTheDocument()
  })

  it('toggles multi-select chips off on second tap', async () => {
    const user = userEvent.setup()
    render(<Quiz onComplete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '25+' }))
    await user.click(await screen.findByRole('button', { name: 'Not a student' }))
    const chip = await screen.findByRole('button', { name: 'Military or veteran' })
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })
})
