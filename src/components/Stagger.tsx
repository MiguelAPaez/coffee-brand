import type { ElementType, ReactNode } from 'react'

type Props = {
  /** Position in the stagger sequence: delays are 0 / 150 / 300 ms. */
  index?: number
  as?: ElementType
  className?: string
  children: ReactNode
}

/** Child of a <Section>: fades in and rises 24px when the section reveals. */
export function Stagger({ index = 0, as: Tag = 'div', className = '', children }: Props) {
  return (
    <Tag
      className={`stagger-item ${className}`}
      style={{ transitionDelay: `${index * 150}ms`, animationDelay: `${index * 150}ms` }}
    >
      {children}
    </Tag>
  )
}
