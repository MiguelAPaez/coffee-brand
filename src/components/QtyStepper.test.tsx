import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QtyStepper } from '@/components/QtyStepper'

function setup(value: number) {
  const onChange = vi.fn()
  render(<QtyStepper value={value} onChange={onChange} label="Quantity" />)
  return onChange
}

describe('QtyStepper', () => {
  it('increments and decrements', async () => {
    const onChange = setup(3)
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(onChange).toHaveBeenLastCalledWith(4)
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(onChange).toHaveBeenLastCalledWith(2)
  })

  it('stays at 10 when already at the max', async () => {
    const onChange = setup(10)
    const plus = screen.getByRole('button', { name: 'Increase quantity' })
    expect(plus).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(plus)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('stays at 1 when already at the min', async () => {
    const onChange = setup(1)
    const minus = screen.getByRole('button', { name: 'Decrease quantity' })
    expect(minus).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(minus)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores non-numeric typing and reverts on blur', async () => {
    const onChange = setup(2)
    const input = screen.getByRole('textbox', { name: 'Quantity' })
    await userEvent.clear(input)
    await userEvent.type(input, 'abc')
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.tab()
    expect(input).toHaveValue('2')
  })

  it('reports typed digits', async () => {
    const onChange = setup(2)
    const input = screen.getByRole('textbox', { name: 'Quantity' })
    await userEvent.clear(input)
    await userEvent.type(input, '4')
    expect(onChange).toHaveBeenLastCalledWith(4)
  })

  it('clamps typed values into range', async () => {
    const onChange = setup(2)
    const input = screen.getByRole('textbox', { name: 'Quantity' })
    await userEvent.clear(input)
    await userEvent.type(input, '99')
    expect(onChange).toHaveBeenLastCalledWith(10)
    await userEvent.clear(input)
    await userEvent.type(input, '0')
    expect(onChange).toHaveBeenLastCalledWith(1)
  })
})
