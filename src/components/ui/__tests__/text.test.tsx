import { Text } from '@/src/components/ui/text'
import { cleanup, render } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

describe('Text', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render with default variant', () => {
    const { getByText } = render(<Text>Hello World</Text>)
    expect(getByText('Hello World')).toBeTruthy()
  })

  it('should render h1 variant', () => {
    const { getByText, getByRole } = render(<Text variant="h1">Title</Text>)
    expect(getByText('Title')).toBeTruthy()
    expect(getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('should render h2 variant', () => {
    const { getByText, getByRole } = render(<Text variant="h2">Subtitle</Text>)
    expect(getByText('Subtitle')).toBeTruthy()
    expect(getByRole('heading', { level: 2 })).toBeTruthy()
  })

  it('should render h3 variant', () => {
    const { getByText, getByRole } = render(<Text variant="h3">Section</Text>)
    expect(getByText('Section')).toBeTruthy()
    expect(getByRole('heading', { level: 3 })).toBeTruthy()
  })

  it('should render h4 variant', () => {
    const { getByText, getByRole } = render(<Text variant="h4">Heading 4</Text>)
    expect(getByText('Heading 4')).toBeTruthy()
    expect(getByRole('heading', { level: 4 })).toBeTruthy()
  })

  it('should render p variant (paragraph)', () => {
    const { getByText } = render(<Text variant="p">Paragraph text</Text>)
    expect(getByText('Paragraph text')).toBeTruthy()
  })

  it('should render blockquote variant', () => {
    const { getByText } = render(<Text variant="blockquote">Quote text</Text>)
    expect(getByText('Quote text')).toBeTruthy()
  })

  it('should render code variant', () => {
    const { getByText } = render(<Text variant="code">const x = 1;</Text>)
    expect(getByText('const x = 1;')).toBeTruthy()
  })

  it('should render lead variant', () => {
    const { getByText } = render(<Text variant="lead">Lead text</Text>)
    expect(getByText('Lead text')).toBeTruthy()
  })

  it('should render large variant', () => {
    const { getByText } = render(<Text variant="large">Large text</Text>)
    expect(getByText('Large text')).toBeTruthy()
  })

  it('should render small variant', () => {
    const { getByText } = render(<Text variant="small">Small text</Text>)
    expect(getByText('Small text')).toBeTruthy()
  })

  it('should render muted variant', () => {
    const { getByText } = render(<Text variant="muted">Muted text</Text>)
    expect(getByText('Muted text')).toBeTruthy()
  })

  it('should accept custom className', () => {
    const { getByText } = render(<Text className="custom-class">Custom</Text>)
    expect(getByText('Custom')).toBeTruthy()
  })

  it('should accept additional props from React Native Text', () => {
    const { getByText } = render(<Text numberOfLines={1}>Truncated text</Text>)
    expect(getByText('Truncated text')).toBeTruthy()
  })
})
