import * as v from 'valibot';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';
import { bootstrap } from './bootstrap.js';
import {
  createDefaultSession,
  V2ManifestSchema,
  V2SessionSchema,
  V3SessionSchema,
} from './types.js';

// ---------------------------------------------------------------------------
// Inline fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = 'session-fixture-1';

const VALID_V2_MANIFEST = {
  version: 2 as const,
  activeSessionId: SESSION_ID,
  sessions: [
    {
      id: SESSION_ID,
      name: 'Test Session',
      createdAt: '2026-06-17T00:00:00.000Z',
      updatedAt: '2026-06-17T00:00:00.000Z',
    },
  ],
};

const VALID_V2_SESSION = {
  version: 2 as const,
  id: SESSION_ID,
  questionScore: {},
  topicOverride: {},
  cardComment: {},
  questionComment: {},
  candidate: {},
  customQuestions: {},
  customSeq: 0,
};

// Verify fixtures are valid per schema (fixture correctness guard)
const _manifestCheck = v.safeParse(V2ManifestSchema, VALID_V2_MANIFEST);
const _sessionCheck = v.safeParse(V2SessionSchema, VALID_V2_SESSION);
if (!_manifestCheck.success)
  throw new Error('VALID_V2_MANIFEST fixture is invalid');
if (!_sessionCheck.success)
  throw new Error('VALID_V2_SESSION fixture is invalid');

// ---------------------------------------------------------------------------
// Scenario A: Empty storage (first run)
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario A: empty storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a default manifest and session when storage is empty', async () => {
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      callback?.({});
      return Promise.resolve({});
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    expect(result.manifest.version).toBe(2);
    expect(result.manifest.sessions).toHaveLength(1);
    expect(Object.keys(result.sessions)).toHaveLength(1);
  });

  it('writes default manifest and session to chrome.storage.local', async () => {
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      callback?.({});
      return Promise.resolve({});
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    await bootstrap();

    expect(chrome.storage.local.set).toHaveBeenCalled();
    const callArg = chrome.storage.local.set.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callArg).toHaveProperty('manifest');
    const manifestKey = Object.keys(callArg).find((k) =>
      k.startsWith('session:'),
    );
    expect(manifestKey).toBeDefined();
  });

  it('returns manifest with version === 2 and a default session', async () => {
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      callback?.({});
      return Promise.resolve({});
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    const sessionId = result.manifest.activeSessionId;
    expect(result.sessions[sessionId]).toBeDefined();
    expect(result.sessions[sessionId].version).toBe(2);
    const defaultSession = createDefaultSession(sessionId);
    expect(result.sessions[sessionId].questionScore).toEqual(
      defaultSession.questionScore,
    );
  });
});

// ---------------------------------------------------------------------------
// Scenario B: Valid v2 data
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario B: valid v2 data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns hydrated {manifest, sessions} for valid v2 manifest and session', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      // Session read
      const result = { [`session:${SESSION_ID}`]: VALID_V2_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });

    const result = await bootstrap();

    expect(result.manifest.version).toBe(2);
    expect(result.manifest.activeSessionId).toBe(SESSION_ID);
    expect(result.sessions[SESSION_ID]).toBeDefined();
    expect(result.sessions[SESSION_ID].version).toBe(2);
  });

  it('returns default session for a session ID that has no stored data', async () => {
    const manifestWithMissingSession = {
      ...VALID_V2_MANIFEST,
      sessions: [
        ...VALID_V2_MANIFEST.sessions,
        {
          id: 'missing-session-id',
          name: 'Missing',
          createdAt: '2026-06-17T00:00:00.000Z',
          updatedAt: '2026-06-17T00:00:00.000Z',
        },
      ],
    };

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: manifestWithMissingSession };
        callback?.(result);
        return Promise.resolve(result);
      }
      // Only first session has data; missing-session-id has none
      const result = { [`session:${SESSION_ID}`]: VALID_V2_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });

    const result = await bootstrap();

    expect(result.sessions['missing-session-id']).toBeDefined();
    expect(result.sessions['missing-session-id'].version).toBe(2);
    expect(result.sessions['missing-session-id'].id).toBe('missing-session-id');
  });
});

// ---------------------------------------------------------------------------
// Scenario C: Legacy v1 data (version !== 2)
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario C: legacy v1 data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const V1_BLOB = {
    version: 1,
    sections: null,
    sectionOpen: {},
    cardOpen: {},
    topicOverride: { 'topic-1': 8 },
    questionScore: { 'q-1': 7 },
    cardComment: {},
    questionComment: {},
    questionNoteOpen: {},
    candidate: { name: 'Alice' },
    customQuestions: {},
    customSeq: 0,
    filters: [],
    levels: [],
    search: '',
    hideReviewed: false,
    sidebarCollapsed: false,
    sidebarGroups: {
      search: true,
      difficulty: true,
      sections: true,
      actions: true,
    },
  };

  it('calls chrome.storage.local.set with migrated v2 manifest and session keys', async () => {
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      const result = { manifest: V1_BLOB };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    await bootstrap();

    expect(chrome.storage.local.set).toHaveBeenCalled();
    const callArg = chrome.storage.local.set.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(callArg).toHaveProperty('manifest');
    const sessionKey = Object.keys(callArg).find((k) =>
      k.startsWith('session:'),
    );
    expect(sessionKey).toBeDefined();
  });

  it('returns migrated v2 {manifest, sessions} with data from v1 blob', async () => {
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      const result = { manifest: V1_BLOB };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    expect(result.manifest.version).toBe(2);
    const sessionId = result.manifest.activeSessionId;
    expect(result.sessions[sessionId]).toBeDefined();
    expect(result.sessions[sessionId].version).toBe(2);
    // Migrated data should preserve questionScore
    expect(result.sessions[sessionId].questionScore).toEqual({ 'q-1': 7 });
  });
});

// ---------------------------------------------------------------------------
// Scenario D: Corrupt / invalid data (recovery path)
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario D: corrupt data (recovery path)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const CORRUPT_MANIFEST = { corrupt: 'data', version: 99 };

  it('writes a recovery:timestamp key when manifest fails V2ManifestSchema validation', async () => {
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      const result = { manifest: CORRUPT_MANIFEST };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    await bootstrap();

    const allSetCalls = chrome.storage.local.set.mock.calls as Array<
      [Record<string, unknown>, ...unknown[]]
    >;
    const recoveryCall = allSetCalls.find((call) => {
      const keys = Object.keys(call[0]);
      return keys.some((k) => k.startsWith('recovery:'));
    });
    expect(recoveryCall).toBeDefined();
  });

  it('writes default manifest and session after preserving corrupt data', async () => {
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      const result = { manifest: CORRUPT_MANIFEST };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    await bootstrap();

    const allSetCalls = chrome.storage.local.set.mock.calls as Array<
      [Record<string, unknown>, ...unknown[]]
    >;
    const manifestCall = allSetCalls.find((call) => {
      const keys = Object.keys(call[0]);
      return keys.includes('manifest');
    });
    expect(manifestCall).toBeDefined();
    const manifest = manifestCall?.[0].manifest as { version: number };
    expect(manifest.version).toBe(2);
  });

  it('returns default {manifest, sessions} and never throws on corrupt data', async () => {
    chrome.storage.local.get.mockImplementation((_keys, callback) => {
      const result = { manifest: CORRUPT_MANIFEST };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    expect(result.manifest.version).toBe(2);
    const sessionId = result.manifest.activeSessionId;
    expect(result.sessions[sessionId]).toBeDefined();
    expect(result.sessions[sessionId].version).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Scenario B: V3 session round-trip (version-aware session validation — CR-03)
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario B: V3 session round-trip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const VALID_V3_SESSION = {
    version: 3 as const,
    id: SESSION_ID,
    scores: { 't1-0': 8 },
    overrides: {},
    notes: {},
    topicNotes: {},
    customQuestions: [],
    candidate: null,
  };

  // Verify the V3 fixture is valid per schema
  const _v3Check = v.safeParse(V3SessionSchema, VALID_V3_SESSION);
  if (!_v3Check.success) throw new Error('VALID_V3_SESSION fixture is invalid');

  it('returns V3 session intact (scores preserved) when a V3 session is stored under a valid V2 manifest', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      // Session read — return a V3 session
      const result = { [`session:${SESSION_ID}`]: VALID_V3_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });

    const result = await bootstrap();

    expect(result.sessions[SESSION_ID]).toBeDefined();
    // V3 session must be returned intact — scores must NOT be empty default
    const session = result.sessions[
      SESSION_ID
    ] as unknown as typeof VALID_V3_SESSION;
    expect(session.scores).toEqual({ 't1-0': 8 });
  });

  it('returns V2 session intact (regression guard) when a V2 session is stored under a valid V2 manifest', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: VALID_V2_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });

    const result = await bootstrap();

    expect(result.sessions[SESSION_ID]).toBeDefined();
    expect(result.sessions[SESSION_ID].version).toBe(2);
    expect(result.sessions[SESSION_ID].id).toBe(SESSION_ID);
  });

  it('returns createDefaultSession fallback when session data is corrupt/unknown (version: 99)', async () => {
    const CORRUPT_SESSION = { version: 99, garbage: true };

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: CORRUPT_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });

    const result = await bootstrap();

    // Should fall back to default session
    const defaultSession = createDefaultSession(SESSION_ID);
    expect(result.sessions[SESSION_ID]).toBeDefined();
    expect(result.sessions[SESSION_ID].version).toBe(2);
    expect(result.sessions[SESSION_ID].id).toBe(SESSION_ID);
    expect(result.sessions[SESSION_ID].questionScore).toEqual(
      defaultSession.questionScore,
    );
  });
});
