import React from 'react'
import { afterEach, vi } from 'vitest'

process.env.TZ = 'UTC'
;(globalThis as any).__DEV__ = false

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

vi.mock('expo-asset', () => ({
  Asset: {
    fromModule(moduleId: number) {
      return {
        async downloadAsync() {
          return undefined
        },
        localUri: `file:///mock/${moduleId}`,
      }
    },
  },
}))

vi.mock('expo-sharing', () => ({
  async isAvailableAsync() {
    return true
  },
  async shareAsync() {
    return undefined
  },
}))

vi.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  requireNativeModule: vi.fn(() => ({})),
  requireOptionalNativeModule: vi.fn(() => ({})),
  EventEmitter: class {
    addListener() {
      return { remove: () => undefined }
    }
    removeAllListeners() {
      return undefined
    }
  },
}))

vi.mock('expo-constants', () => ({
  default: {
    expoVersion: '0.0.0',
    appOwnership: 'standalone',
    manifest: {},
    manifest2: {},
  },
}))

vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('expo-linking', () => ({
  openURL: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('expo-intent-launcher', () => ({
  startActivityAsync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('expo-navigation-bar', () => ({
  setBackgroundColorAsync: vi.fn().mockResolvedValue(undefined),
  setButtonStyleAsync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

vi.mock('@rn-primitives/slot', () => ({
  Text: React.forwardRef<any, any>(({ children, ...rest }, ref) =>
    React.createElement('span', { ...rest, ref }, children)
  ),
  Slot: React.forwardRef<any, any>(({ children, ...rest }, ref) =>
    React.isValidElement(children)
      ? React.cloneElement(
          children as React.ReactElement,
          { ...rest, ref } as any
        )
      : React.createElement('span', { ...rest, ref }, children)
  ),
}))

vi.mock('react-native-toast-message', () => {
  const mockShow = vi.fn()
  const MockToast = () => null
  return {
    __esModule: true,
    default: Object.assign(MockToast, { show: mockShow, hide: vi.fn() }),
    show: mockShow,
    hide: vi.fn(),
    setRef: vi.fn(),
  }
})

vi.mock('react-native', () => {
  const createElement = React.createElement

  function createComponent(tag: string) {
    return function Component(props: any) {
      const { children, ...rest } = props
      return createElement(tag, rest, children)
    }
  }

  const Pressable = ({ onPress, children, ...rest }: any) =>
    createElement(
      'button',
      { onClick: onPress, type: 'button', ...rest },
      children
    )

  class NativeEventEmitter {
    addListener() {
      return { remove: () => undefined }
    }
    removeAllListeners() {
      return undefined
    }
  }

  return {
    __esModule: true,
    default: {},
    Pressable,
    Text: createComponent('span'),
    View: createComponent('div'),
    ScrollView: createComponent('div'),
    TouchableOpacity: Pressable,
    Alert: { alert: vi.fn() },
    Platform: {
      OS: 'web',
      select: (options: any) => options?.web ?? options?.default,
      Version: 'test',
    },
    StyleSheet: { create: (styles: any) => styles },
    Linking: { openURL: vi.fn().mockResolvedValue(undefined) },
    NativeModules: {},
    NativeEventEmitter,
    DeviceEventEmitter: new NativeEventEmitter(),
    TurboModuleRegistry: {
      getEnforcing: vi.fn(() => ({})),
      get: vi.fn(() => ({})),
    },
  }
})
