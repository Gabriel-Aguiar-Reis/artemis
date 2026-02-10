export const Asset = {
  fromModule(moduleId: number) {
    return {
      downloadAsync: async () => undefined,
      localUri: `file:///mock/${moduleId}`,
    }
  },
}

export default { Asset }
