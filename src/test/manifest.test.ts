import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

describe('manifest.json structure', () => {
  it('manifest.json exists at repo root', () => {
    expect(existsSync(join(ROOT, 'manifest.json'))).toBe(true);
  });

  it('manifest.json is valid JSON', () => {
    const content = readFileSync(join(ROOT, 'manifest.json'), 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('manifest_version is 3', () => {
    const manifest = JSON.parse(
      readFileSync(join(ROOT, 'manifest.json'), 'utf-8'),
    );
    expect(manifest.manifest_version).toBe(3);
  });

  it('permissions is exactly ["storage"]', () => {
    const manifest = JSON.parse(
      readFileSync(join(ROOT, 'manifest.json'), 'utf-8'),
    );
    expect(manifest.permissions).toEqual(['storage']);
  });

  it('action has no default_popup key', () => {
    const manifest = JSON.parse(
      readFileSync(join(ROOT, 'manifest.json'), 'utf-8'),
    );
    expect(manifest.action?.default_popup).toBeUndefined();
  });

  it('has no host_permissions key', () => {
    const manifest = JSON.parse(
      readFileSync(join(ROOT, 'manifest.json'), 'utf-8'),
    );
    expect(manifest.host_permissions).toBeUndefined();
  });

  it('permissions does not contain tabs, scripting, or activeTab', () => {
    const manifest = JSON.parse(
      readFileSync(join(ROOT, 'manifest.json'), 'utf-8'),
    );
    const perms: string[] = manifest.permissions ?? [];
    expect(perms).not.toContain('tabs');
    expect(perms).not.toContain('scripting');
    expect(perms).not.toContain('activeTab');
  });

  it('background.type is "module"', () => {
    const manifest = JSON.parse(
      readFileSync(join(ROOT, 'manifest.json'), 'utf-8'),
    );
    expect(manifest.background?.type).toBe('module');
  });

  it('manifest.json declares commands._execute_action with Alt+Shift+I default key', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf-8'));
    expect(manifest.commands).toBeDefined();
    expect(manifest.commands._execute_action).toBeDefined();
    expect(manifest.commands._execute_action.suggested_key.default).toBe('Alt+Shift+I');
  });

  it('manifest.json declares web_accessible_resources for welcome.html', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf-8'));
    const war: Array<{ resources: string[] }> = manifest.web_accessible_resources ?? [];
    const allResources = war.flatMap((entry) => entry.resources);
    expect(allResources).toContain('src/app/welcome.html');
  });
});

describe('vite.config.ts structure', () => {
  it('vite.config.ts exists at repo root', () => {
    expect(existsSync(join(ROOT, 'vite.config.ts'))).toBe(true);
  });

  it('vite.config.ts contains sourcemap hidden (not eval or inline)', () => {
    const content = readFileSync(join(ROOT, 'vite.config.ts'), 'utf-8');
    expect(content).toContain("sourcemap: 'hidden'");
    expect(content).not.toContain("sourcemap: 'eval'");
    expect(content).not.toContain("sourcemap: 'inline'");
  });

  it('vite.config.ts imports and calls crx({ manifest })', () => {
    const content = readFileSync(join(ROOT, 'vite.config.ts'), 'utf-8');
    expect(content).toMatch(/crx\(\{.*manifest.*\}\)/s);
  });
});

describe('src/app scaffold files', () => {
  it('src/app/app.html exists', () => {
    expect(existsSync(join(ROOT, 'src', 'app', 'app.html'))).toBe(true);
  });

  it('src/app/app.html contains <div id="root">', () => {
    const content = readFileSync(join(ROOT, 'src', 'app', 'app.html'), 'utf-8');
    expect(content).toContain('<div id="root">');
  });

  it('src/app/app.html contains <script type="module" src="./main.tsx">', () => {
    const content = readFileSync(join(ROOT, 'src', 'app', 'app.html'), 'utf-8');
    expect(content).toContain('type="module"');
    expect(content).toContain('src="./main.tsx"');
  });

  it('src/app/app.html has no inline script content', () => {
    const content = readFileSync(join(ROOT, 'src', 'app', 'app.html'), 'utf-8');
    // No inline scripts: <script>...</script> with content between tags
    expect(content).not.toMatch(/<script[^>]*>[^<]+<\/script>/);
  });

  it('src/app/main.tsx exists', () => {
    expect(existsSync(join(ROOT, 'src', 'app', 'main.tsx'))).toBe(true);
  });

  it('src/app/main.tsx uses throw new Error for null root guard', () => {
    const content = readFileSync(join(ROOT, 'src', 'app', 'main.tsx'), 'utf-8');
    expect(content).toContain('throw new Error');
    // Must NOT use non-null assertion for root element
    expect(content).not.toMatch(/getElementById\('root'\)!/);
  });

  it('src/app/App.tsx exists with named export', () => {
    expect(existsSync(join(ROOT, 'src', 'app', 'App.tsx'))).toBe(true);
    const content = readFileSync(join(ROOT, 'src', 'app', 'App.tsx'), 'utf-8');
    expect(content).toContain('export function App');
  });
});

describe('public/icons placeholder files', () => {
  const iconSizes = [16, 32, 48, 128];

  for (const size of iconSizes) {
    it(`public/icons/icon-${size}.png exists`, () => {
      expect(
        existsSync(join(ROOT, 'public', 'icons', `icon-${size}.png`)),
      ).toBe(true);
    });
  }
});
