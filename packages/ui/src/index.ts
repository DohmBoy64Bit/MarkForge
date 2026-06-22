import React from 'react'

export type IconButtonProps = {
  active?: boolean
  ariaLabel: string
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
  title: string
}

export type ToolbarGroup = {
  ariaLabel: string
  id: string
}

export function IconButton(props: IconButtonProps): React.ReactElement {
  return React.createElement(
    'button',
    {
      type: 'button',
      'aria-label': props.ariaLabel,
      'aria-pressed': props.active ?? undefined,
      className: props.active ? 'active' : undefined,
      disabled: props.disabled,
      onClick: props.onClick,
      title: props.title
    },
    props.children
  )
}

export function makeToolbarGroup(id: string, ariaLabel: string): ToolbarGroup {
  return { id, ariaLabel }
}

export function clampActiveIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) return 0
  return Math.max(0, Math.min(index, itemCount - 1))
}

export function nextActiveIndex(current: number, delta: number, itemCount: number): number {
  if (itemCount <= 0) return 0
  return (current + delta + itemCount) % itemCount
}
