import { Button } from '@/src/components/ui/button'
import { render } from '@testing-library/react'
import React from 'react'
import { Text } from 'react-native'
import { describe, expect, it, vitest } from 'vitest'

// Mock do Text component
vitest.mock('@/src/components/ui/text', () => ({
  Text: ({ children, ...props }: any) => {
    const RNText = require('react-native').Text
    return <RNText {...props}>{children}</RNText>
  },
  TextClassContext: require('react').createContext(undefined),
}))

describe('Button', () => {
  it('should render with default variant', () => {
    const { getByText } = render(
      <Button>
        <Text>Click me</Text>
      </Button>
    )
    expect(getByText('Click me')).toBeTruthy()
  })

  it('should call onPress when pressed', () => {
    const onPressMock = vitest.fn()
    const { getByText } = render(
      <Button onPress={onPressMock}>
        <Text>Press</Text>
      </Button>
    )

    const element = getByText('Press') as HTMLElement
    element.click()
    expect(onPressMock).toHaveBeenCalledTimes(1)
  })

  it('should render destructive variant', () => {
    const { getByText } = render(
      <Button variant="destructive">
        <Text>Delete</Text>
      </Button>
    )
    expect(getByText('Delete')).toBeTruthy()
  })

  it('should render outline variant', () => {
    const { getByText } = render(
      <Button variant="outline">
        <Text>Outline</Text>
      </Button>
    )
    expect(getByText('Outline')).toBeTruthy()
  })

  it('should render secondary variant', () => {
    const { getByText } = render(
      <Button variant="secondary">
        <Text>Secondary</Text>
      </Button>
    )
    expect(getByText('Secondary')).toBeTruthy()
  })

  it('should render ghost variant', () => {
    const { getByText } = render(
      <Button variant="ghost">
        <Text>Ghost</Text>
      </Button>
    )
    expect(getByText('Ghost')).toBeTruthy()
  })

  it('should render link variant', () => {
    const { getByText } = render(
      <Button variant="link">
        <Text>Link</Text>
      </Button>
    )
    expect(getByText('Link')).toBeTruthy()
  })

  it('should render small size', () => {
    const { getByText } = render(
      <Button size="sm">
        <Text>Small</Text>
      </Button>
    )
    expect(getByText('Small')).toBeTruthy()
  })

  it('should render large size', () => {
    const { getByText } = render(
      <Button size="lg">
        <Text>Large</Text>
      </Button>
    )
    expect(getByText('Large')).toBeTruthy()
  })

  it('should render icon size', () => {
    const { getByText } = render(
      <Button size="icon">
        <Text>I</Text>
      </Button>
    )
    expect(getByText('I')).toBeTruthy()
  })

  it('should not call onPress when disabled', () => {
    const onPressMock = vitest.fn()
    const { getByText } = render(
      <Button onPress={onPressMock} disabled>
        <Text>Disabled</Text>
      </Button>
    )

    const element = getByText('Disabled') as HTMLElement
    element.click()
    expect(onPressMock).not.toHaveBeenCalled()
  })

  it('should accept custom className', () => {
    const { getByText } = render(
      <Button className="custom-class">
        <Text>Custom</Text>
      </Button>
    )
    expect(getByText('Custom')).toBeTruthy()
  })
})
