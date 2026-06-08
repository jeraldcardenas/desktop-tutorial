/* eslint-env jest */
// Use the official in-memory mock so storage logic can be unit tested.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
