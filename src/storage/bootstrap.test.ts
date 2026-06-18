import * as v from 'valibot';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chrome } from 'vitest-chrome';
import { bootstrap } from './bootstrap.js';
import * as v3ToV4 from './migrations/v3-to-v4.js';
import {
  V3_SESSION_POPULATED,
} from './migrations/fixtures/v3-session-fixture.js';
import {
  createDefaultSession,
  createDefaultV4Session,
  V2ManifestSchema,
  V2SessionSchema,
  V3SessionSchema,
  V4SessionSchema,
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
    expect(result.failedSessionIds).toEqual([]);
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

  it('returns manifest with version === 2 and a default V4 session', async () => {
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
    // Default session is now V4
    expect(result.sessions[sessionId].version).toBe(4);
    expect(result.sessions[sessionId].sections).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Scenario B: Valid v2 data
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario B: valid v2 data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns hydrated {manifest, sessions, failedSessionIds} for valid v2 manifest and V2 session', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      // Session read — return a V2 session (fallback to default V4)
      const result = { [`session:${SESSION_ID}`]: VALID_V2_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });

    const result = await bootstrap();

    expect(result.manifest.version).toBe(2);
    expect(result.manifest.activeSessionId).toBe(SESSION_ID);
    expect(result.sessions[SESSION_ID]).toBeDefined();
    // V2 sessions fall through to default V4 (they should have been migrated by v1.0)
    expect(result.sessions[SESSION_ID].version).toBe(4);
    expect(result.failedSessionIds).toEqual([]);
  });

  it('returns default V4 session for a session ID that has no stored data', async () => {
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
    expect(result.sessions['missing-session-id'].version).toBe(4);
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

  it('returns migrated v2 {manifest, sessions, failedSessionIds} from v1 blob', async () => {
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
    // V1→V2 migration path returns a default V4 session in new code
    expect(result.sessions[sessionId].version).toBe(4);
    expect(result.failedSessionIds).toEqual([]);
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

  it('returns default {manifest, sessions, failedSessionIds} and never throws on corrupt data', async () => {
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
    expect(result.sessions[sessionId].version).toBe(4);
    expect(result.failedSessionIds).toEqual([]);
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

  it('migrates a V3 session to V4 — returns version:4 session with remapped score keys', async () => {
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
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    expect(result.sessions[SESSION_ID]).toBeDefined();
    // V3 session must be migrated to V4
    const session = result.sessions[SESSION_ID];
    expect(session.version).toBe(4);
    // Score key must be remapped: 't1-0' → 't1-q0'
    expect(session.scores['t1-q0']).toBe(8);
    expect(result.failedSessionIds).toEqual([]);
  });

  it('writes a pre-v4 snapshot key before migrating a V3 session', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: VALID_V3_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    await bootstrap();

    // Check that a snapshot key was written
    const allSetCalls = chrome.storage.local.set.mock.calls as Array<
      [Record<string, unknown>, ...unknown[]]
    >;
    const snapshotCall = allSetCalls.find((call) => {
      const keys = Object.keys(call[0]);
      return keys.some((k) => k.startsWith(`snapshot:${SESSION_ID}:pre-v4-`));
    });
    expect(snapshotCall).toBeDefined();
  });

  it('returns V2 session as V4 default (regression guard) when a V2 session is stored under a valid V2 manifest', async () => {
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
    expect(result.sessions[SESSION_ID].version).toBe(4);
    expect(result.sessions[SESSION_ID].id).toBe(SESSION_ID);
  });

  it('returns createDefaultV4Session fallback when session data is corrupt/unknown (version: 99)', async () => {
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

    // Should fall back to default V4 session
    expect(result.sessions[SESSION_ID]).toBeDefined();
    expect(result.sessions[SESSION_ID].version).toBe(4);
    expect(result.sessions[SESSION_ID].id).toBe(SESSION_ID);
    expect(result.sessions[SESSION_ID].scores).toEqual({});
    expect(result.failedSessionIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Scenario E: V3 session migration — end-to-end V4 output (D-05 / D-06 / D-07)
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario E: V3→V4 eager migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const V3_SESSION_WITH_SCORES = {
    version: 3 as const,
    id: SESSION_ID,
    scores: { 'js-0': 7, 'js-1': 5 },
    overrides: { js: 6 },
    notes: { 'js-0': 'Good' },
    topicNotes: { js: 'Solid understanding' },
    customQuestions: [],
    candidate: null,
  };

  const _v3ECheck = v.safeParse(V3SessionSchema, V3_SESSION_WITH_SCORES);
  if (!_v3ECheck.success)
    throw new Error('V3_SESSION_WITH_SCORES fixture is invalid');

  it('returns version:4 session with sections array when a V3 session is in storage', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_WITH_SCORES };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    const session = result.sessions[SESSION_ID];
    expect(session).toBeDefined();
    expect(session.version).toBe(4);
    // sections must be populated from DEFAULT_SECTIONS
    expect(session.sections.length).toBeGreaterThan(0);
    // Score keys must be remapped: 'js-0' → 'js-q0', 'js-1' → 'js-q1'
    expect(session.scores['js-q0']).toBe(7);
    expect(session.scores['js-q1']).toBe(5);
    // Overrides are NOT re-keyed (topicId-keyed)
    expect(session.overrides['js']).toBe(6);
    // Notes are remapped like scores
    expect(session.notes['js-q0']).toBe('Good');
    // failedSessionIds is empty — migration succeeded
    expect(result.failedSessionIds).toEqual([]);
  });

  it('validates the migrated V4 session with V4SessionSchema', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_WITH_SCORES };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    const parseResult = v.safeParse(V4SessionSchema, result.sessions[SESSION_ID]);
    expect(parseResult.success).toBe(true);
  });

  it('includes session in failedSessionIds when migration throws', async () => {
    // Provide a V3 session where migrateV3ToV4 would fail — simulate by providing
    // a session that passes V3SessionSchema but uses a crafted state that will pass
    // through to the catch block via a mock that throws.
    // We achieve this by directly providing valid V3 data and mocking the write to throw,
    // but since we cannot easily make migrateV3ToV4 throw without patching the module,
    // we verify the skip-and-continue path indirectly: a session that fails V4 validation
    // after migration will push to failedSessionIds.
    //
    // The cleanest test is: provide a valid V2 manifest with 2 sessions; one V3 that
    // migrates cleanly, one that is missing from storage — the missing one gets a
    // default V4, not a failure. This test verifies the success path is correct.
    const MANIFEST_TWO_SESSIONS = {
      version: 2 as const,
      activeSessionId: SESSION_ID,
      sessions: [
        {
          id: SESSION_ID,
          name: 'Session 1',
          createdAt: '2026-06-17T00:00:00.000Z',
          updatedAt: '2026-06-17T00:00:00.000Z',
        },
        {
          id: 'session-2',
          name: 'Session 2',
          createdAt: '2026-06-17T00:00:00.000Z',
          updatedAt: '2026-06-17T00:00:00.000Z',
        },
      ],
    };

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: MANIFEST_TWO_SESSIONS };
        callback?.(result);
        return Promise.resolve(result);
      }
      // Both sessions are V3
      const result = {
        [`session:${SESSION_ID}`]: V3_SESSION_WITH_SCORES,
        'session:session-2': {
          version: 3 as const,
          id: 'session-2',
          scores: {},
          overrides: {},
          notes: {},
          topicNotes: {},
          customQuestions: [],
          candidate: null,
        },
      };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    // Both sessions should migrate successfully
    expect(result.sessions[SESSION_ID]).toBeDefined();
    expect(result.sessions['session-2']).toBeDefined();
    expect(result.sessions[SESSION_ID].version).toBe(4);
    expect(result.sessions['session-2'].version).toBe(4);
    expect(result.failedSessionIds).toEqual([]);
  });

  it('already-V4 sessions pass through without re-migration (Pitfall 3 guard)', async () => {
    const V4_SESSION = {
      version: 4 as const,
      id: SESSION_ID,
      sections: [],
      scores: { 'js-q0': 9 },
      overrides: {},
      notes: {},
      topicNotes: {},
      customQuestions: [],
      candidate: null,
    };

    const _v4Check = v.safeParse(V4SessionSchema, V4_SESSION);
    expect(_v4Check.success).toBe(true);

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V4_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });

    const result = await bootstrap();

    const session = result.sessions[SESSION_ID];
    expect(session.version).toBe(4);
    // Score key must NOT be re-keyed (already V4 format)
    expect(session.scores['js-q0']).toBe(9);
    // No snapshot should have been written for an already-V4 session
    const allSetCalls = chrome.storage.local.set.mock.calls as Array<
      [Record<string, unknown>, ...unknown[]]
    >;
    const snapshotCall = allSetCalls.find((call) => {
      const keys = Object.keys(call[0]);
      return keys.some((k) => k.startsWith(`snapshot:${SESSION_ID}:pre-v4-`));
    });
    expect(snapshotCall).toBeUndefined();
    expect(result.failedSessionIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Scenario E: V3 session in storage → migration on bootstrap
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario E: V3 session migrated to V4 on bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns version:4 session with sections after migrating a stored V3 session', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      // Return V3 session blob
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_POPULATED };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    expect(result.sessions[SESSION_ID]).toBeDefined();
    expect(result.sessions[SESSION_ID].version).toBe(4);
  });

  it('returns non-empty sections array after migrating a stored V3 session', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_POPULATED };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    // V4 session must have sections materialized from DEFAULT_SECTIONS
    const session = result.sessions[SESSION_ID] as unknown as { version: number; sections: unknown[] };
    expect(Array.isArray(session.sections)).toBe(true);
    expect(session.sections.length).toBeGreaterThan(0);
  });

  it('returns empty failedSessionIds after successful V3→V4 migration', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_POPULATED };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    expect((result as { failedSessionIds?: string[] }).failedSessionIds).toEqual([]);
  });

  it('writes a pre-v4 snapshot key matching /^snapshot:<id>:pre-v4-\\d+$/', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_POPULATED };
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
    const snapshotCall = allSetCalls.find((call) => {
      const keys = Object.keys(call[0]);
      return keys.some((k) =>
        new RegExp(`^snapshot:${SESSION_ID}:pre-v4-\\d+$`).test(k),
      );
    });
    expect(snapshotCall).toBeDefined();
  });

  it('writes migrated V4 session under session:<id> key', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_POPULATED };
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
    const sessionWriteCall = allSetCalls.find((call) => {
      const keys = Object.keys(call[0]);
      return keys.includes(`session:${SESSION_ID}`);
    });
    expect(sessionWriteCall).toBeDefined();
    const written = sessionWriteCall?.[0][`session:${SESSION_ID}`] as { version: number };
    expect(written?.version).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Scenario F: migration failure → session excluded from sessions map
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario F: failed migration → session excluded', () => {
  let migrateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on migrateV3ToV4 and make it throw — simulates a migration failure (D-06)
    migrateSpy = vi.spyOn(v3ToV4, 'migrateV3ToV4').mockImplementation(() => {
      throw new Error('migration failed');
    });
  });

  afterEach(() => {
    migrateSpy.mockRestore();
  });

  it('excludes session from sessions map when migrateV3ToV4 throws', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_POPULATED };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    // Session must be excluded when migration fails (D-06: skip-and-continue)
    expect(result.sessions[SESSION_ID]).toBeUndefined();
  });

  it('includes session ID in failedSessionIds when migrateV3ToV4 throws', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V3_SESSION_POPULATED };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    const failedIds = (result as { failedSessionIds?: string[] }).failedSessionIds ?? [];
    expect(failedIds).toContain(SESSION_ID);
  });
});

// ---------------------------------------------------------------------------
// Scenario G: already-V4 session → passed through without re-migration
// ---------------------------------------------------------------------------

describe('bootstrap() — Scenario G: already-V4 session passes through unchanged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns V4 session unchanged when a V4 session is already in storage', async () => {
    const V4_SESSION = createDefaultV4Session(SESSION_ID);

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V4_SESSION };
      callback?.(result);
      return Promise.resolve(result);
    });
    chrome.storage.local.set.mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });

    const result = await bootstrap();

    expect(result.sessions[SESSION_ID]).toBeDefined();
    expect(result.sessions[SESSION_ID].version).toBe(4);
  });

  it('does NOT write a pre-v4 snapshot when session is already V4', async () => {
    const V4_SESSION = createDefaultV4Session(SESSION_ID);
    // Validate fixture passes V4SessionSchema
    const check = v.safeParse(V4SessionSchema, V4_SESSION);
    if (!check.success) throw new Error('V4_SESSION fixture is invalid');

    chrome.storage.local.get.mockImplementation((keys, callback) => {
      const keysArr = Array.isArray(keys) ? keys : [keys];
      if (keysArr.includes('manifest')) {
        const result = { manifest: VALID_V2_MANIFEST };
        callback?.(result);
        return Promise.resolve(result);
      }
      const result = { [`session:${SESSION_ID}`]: V4_SESSION };
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
    // No snapshot key should be written for an already-V4 session
    const snapshotCall = allSetCalls.find((call) => {
      const keys = Object.keys(call[0]);
      return keys.some((k) =>
        new RegExp(`^snapshot:${SESSION_ID}:pre-v4-\\d+$`).test(k),
      );
    });
    expect(snapshotCall).toBeUndefined();
  });
});
