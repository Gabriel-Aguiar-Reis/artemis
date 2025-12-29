export function requireNativeModule() {
  return {}
}

export function requireOptionalNativeModule() {
  return {}
}

export const NativeModulesProxy = {}

export class EventEmitter {
  addListener() {
    return { remove: () => undefined }
  }
  removeAllListeners() {
    return undefined
  }
}

export default {
  requireNativeModule,
  requireOptionalNativeModule,
  NativeModulesProxy,
  EventEmitter,
}
