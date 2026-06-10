import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { EmailCapture } from './EmailCapture'

describe('EmailCapture', () => {
  it('rejects an invalid email with an inline error', async () => {
    const user = userEvent.setup()
    render(<EmailCapture />)
    await user.type(screen.getByLabelText('Email address'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: 'Flag me' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/doesn't look like an email/)
  })

  it('shows the success state after a valid submit', async () => {
    const user = userEvent.setup()
    render(<EmailCapture />)
    await user.type(screen.getByLabelText('Email address'), 'vault@example.com')
    await user.click(screen.getByRole('button', { name: 'Flag me' }))
    expect(screen.getByText("You're on the list.")).toBeInTheDocument()
  })

  it('clears the error once the user edits the field', async () => {
    const user = userEvent.setup()
    render(<EmailCapture />)
    await user.type(screen.getByLabelText('Email address'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Flag me' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email address'), 'x')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
