import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App — full flow against the real dataset', () => {
  it('intro → quiz → results for a 25+ non-student shows everyone-perks only', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open the vault' }))
    await user.click(screen.getByRole('button', { name: '25+' }))
    await user.click(await screen.findByRole('button', { name: 'Not a student' }))
    await user.click(await screen.findByRole('button', { name: 'None of these — continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip — continue' }))
    await user.click(screen.getByRole('button', { name: 'Open my vault' }))

    expect(await screen.findByText('Value on the table*')).toBeInTheDocument()
    // Open-to-everyone offers are present…
    expect(screen.getByText('Free Weekly Credit Reports')).toBeInTheDocument()
    // …age/state-gated and student offers are not.
    expect(screen.queryByText(/DraftKings/)).not.toBeInTheDocument()
    expect(screen.queryByText('Spotify Premium Student')).not.toBeInTheDocument()
  })

  it('college student in NJ with betting interest sees student + sportsbook perks', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open the vault' }))
    await user.click(screen.getByRole('button', { name: '21–24' }))
    await user.click(await screen.findByRole('button', { name: 'College student' }))
    await user.click(await screen.findByRole('button', { name: 'None of these — continue' }))
    await user.selectOptions(screen.getByLabelText('State'), 'NJ')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Sports betting' }))
    await user.click(screen.getByRole('button', { name: 'Open my vault' }))

    expect(await screen.findByText('Value on the table*')).toBeInTheDocument()
    expect(screen.getByText('Spotify Premium Student')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /DraftKings/ })).toBeInTheDocument()
    expect(screen.getAllByText(/1-800-GAMBLER/).length).toBeGreaterThan(0)
  })

  it('start over returns to the intro', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Open the vault' }))
    await user.click(screen.getByRole('button', { name: '25+' }))
    await user.click(await screen.findByRole('button', { name: 'Not a student' }))
    await user.click(await screen.findByRole('button', { name: 'None of these — continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip — continue' }))
    await user.click(screen.getByRole('button', { name: 'Open my vault' }))
    await user.click(await screen.findByRole('button', { name: 'Start over' }))
    expect(screen.getByRole('button', { name: 'Open the vault' })).toBeInTheDocument()
  })
})
