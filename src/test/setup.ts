import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { expect } from 'vitest';

// Mock browser WebRTC APIs
const mockRTCPeerConnection = vi.fn().mockImplementation(() => ({
  createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
  createDataChannel: vi.fn().mockReturnValue({
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null,
    send: vi.fn(),
  }),
  addTrack: vi.fn(),
  close: vi.fn(),
  setLocalDescription: vi.fn().mockResolvedValue(undefined),
  setRemoteDescription: vi.fn().mockResolvedValue(undefined),
  addIceCandidate: vi.fn().mockResolvedValue(undefined),
  iceConnectionState: 'new',
  connectionState: 'new',
  oniceconnectionstatechange: null,
  onconnectionstatechange: null,
  onicecandidate: null,
  ontrack: null,
  restartIce: vi.fn(),
  getTransceivers: vi.fn().mockReturnValue([]),
  addTransceiver: vi.fn(),
  getStats: vi.fn().mockResolvedValue(new Map()),
  getSenders: vi.fn().mockReturnValue([]),
  getReceivers: vi.fn().mockReturnValue([]),
}));

const mockMediaStream = vi.fn().mockImplementation(() => ({
  getTracks: vi.fn().mockReturnValue([
    {
      kind: 'audio',
      stop: vi.fn(),
      enabled: true,
    },
  ]),
  getAudioTracks: vi.fn().mockReturnValue([
    {
      kind: 'audio',
      stop: vi.fn(),
      enabled: true,
    },
  ]),
  getVideoTracks: vi.fn().mockReturnValue([]),
}));

// Mock WebSocket
const mockWebSocket = vi.fn().mockImplementation((url: string) => ({
  url,
  readyState: 1, // OPEN
  send: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
}));

// Mock AudioContext and related APIs
const mockAudioContext = vi.fn().mockImplementation(() => ({
  createAnalyser: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 0,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn((dataArray) => {
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = Math.floor(Math.random() * 256);
      }
    }),
    smoothingTimeConstant: 0,
  }),
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  close: vi.fn().mockResolvedValue(undefined),
  state: 'running',
}));

// Mock navigator.mediaDevices API
const mockMediaDevices = {
  getUserMedia: vi.fn().mockImplementation(() => Promise.resolve(new mockMediaStream())),
  enumerateDevices: vi.fn().mockResolvedValue([
    { kind: 'audioinput', deviceId: 'mock-audio-device' },
  ]),
};

// Assign mocks to global object
Object.defineProperty(global, 'RTCPeerConnection', {
  value: mockRTCPeerConnection,
  writable: true,
});

Object.defineProperty(global, 'MediaStream', {
  value: mockMediaStream,
  writable: true,
});

Object.defineProperty(global, 'WebSocket', {
  value: mockWebSocket,
  writable: true,
});

Object.defineProperty(global, 'AudioContext', {
  value: mockAudioContext,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: {
    ...global.navigator,
    mediaDevices: mockMediaDevices,
  },
  writable: true,
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((callback) => {
  return setTimeout(callback, 0);
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});