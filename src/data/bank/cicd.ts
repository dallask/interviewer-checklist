import type { Section } from './types.js';

export const cicdSection: Section = {
  id: 'cicd',
  label: 'CI / CD',
  icon: '🚀',
  items: [
    {
      id: 'semrel',
      name: 'Semantic Release',
      desc: 'Automated versioning and changelog from commits',
      tag: 'Release',
      questions: [
        {
          q: 'How does semantic-release determine whether to bump a major, minor, or patch version?',
          level: 'advanced',
        },
        {
          q: 'What is the role of @semantic-release/github in the release pipeline?',
          level: 'advanced',
        },
        {
          q: 'How do you configure semantic-release to publish to npm and GitHub simultaneously?',
          level: 'intermediate',
        },
        {
          q: 'Where in the CI pipeline should semantic-release run?',
          level: 'advanced',
        },
        {
          q: 'How do you publish a pre-release (beta/next) channel separately from stable releases?',
          level: 'advanced',
        },
        {
          q: 'How would you order lint → test → build → release → deploy stages and gate each in the pipeline?',
          level: 'expert',
        },
        { q: 'What is semantic versioning?', level: 'novice' },
        { q: 'What is a changelog?', level: 'novice' },
        { q: 'What does automated release mean?', level: 'novice' },
        {
          q: 'How do commit types map to version bumps?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure which branches release?',
          level: 'intermediate',
        },
        {
          q: 'How would you coordinate releases across multiple packages in a monorepo?',
          level: 'expert',
        },
        {
          q: 'How do you recover from a bad automated release?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'conventionalcommits',
      name: 'Conventional Commits',
      desc: 'Enforced via Commitizen + cz-conventional-changelog',
      tag: 'Git',
      questions: [
        {
          q: 'What is the conventional commit message format?',
          level: 'novice',
        },
        {
          q: 'How do feat, fix, chore, refactor, and BREAKING CHANGE map to semver bumps?',
          level: 'expert',
        },
        {
          q: 'How does Commitizen guide developers through writing compliant commit messages?',
          level: 'intermediate',
        },
        {
          q: 'How do you run Commitizen (npm run commit)?',
          level: 'intermediate',
        },
        {
          q: 'What commit scopes would you define for this monorepo and why?',
          level: 'novice',
        },
        { q: 'What is a commit-message convention?', level: 'novice' },
        {
          q: 'How do you write a breaking-change commit?',
          level: 'intermediate',
        },
        {
          q: 'How do you enforce the convention with commitlint in a hook?',
          level: 'advanced',
        },
        {
          q: 'How do you keep squash-merge messages conventional?',
          level: 'advanced',
        },
        {
          q: 'How do you retrofit the convention onto a team mid-project?',
          level: 'advanced',
        },
        {
          q: 'How would you derive release notes and version bumps purely from commit history?',
          level: 'expert',
        },
        {
          q: 'How do you reconcile conventional commits with heavy rebasing/squashing?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'husky',
      name: 'Husky',
      desc: 'Git hooks for pre-commit linting',
      tag: 'Git',
      questions: [
        {
          q: 'How do you add a new Husky pre-commit hook?',
          level: 'intermediate',
        },
        {
          q: 'What does the prepare script in package.json do for Husky?',
          level: 'novice',
        },
        {
          q: 'How do you bypass a Husky hook when necessary?',
          level: 'intermediate',
        },
        {
          q: 'How does Husky 8 differ from earlier versions in hook configuration?',
          level: 'intermediate',
        },
        {
          q: 'How do you run different logic for commit-msg, pre-commit, and pre-push hooks?',
          level: 'intermediate',
        },
        { q: 'What is a Git hook?', level: 'novice' },
        { q: 'What is Husky?', level: 'novice' },
        {
          q: "How do you keep hooks fast so they don't slow down committing?",
          level: 'advanced',
        },
        {
          q: 'How do you share hooks reliably across the team?',
          level: 'advanced',
        },
        {
          q: 'How do you make hooks behave correctly in CI versus locally?',
          level: 'advanced',
        },
        {
          q: 'How would you debug a hook that fails only on certain machines or OSes?',
          level: 'expert',
        },
        {
          q: 'How do you prevent hooks being bypassed while keeping an emergency escape hatch?',
          level: 'expert',
        },
        {
          q: 'How would you migrate hook logic if you change tooling (Husky to lefthook)?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'lintstaged',
      name: 'lint-staged',
      desc: 'Lints only staged files for fast pre-commit checks',
      tag: 'Git',
      questions: [
        {
          q: 'How does lint-staged know which files to process?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure lint-staged for multiple file types (JS, SCSS)?',
          level: 'intermediate',
        },
        {
          q: 'What happens if lint-staged modifies a file — does the fix get committed?',
          level: 'intermediate',
        },
        {
          q: 'How do you test your lint-staged config without committing?',
          level: 'intermediate',
        },
        {
          q: 'How do you keep lint-staged fast on a large repo (concurrency, partial staging, caching)?',
          level: 'advanced',
        },
        { q: 'What does lint-staged do?', level: 'novice' },
        { q: 'Why lint only staged files?', level: 'novice' },
        { q: 'Where is lint-staged configured?', level: 'novice' },
        {
          q: 'How do you run different commands per file type?',
          level: 'advanced',
        },
        { q: 'How do you ensure auto-fixes get re-staged?', level: 'advanced' },
        {
          q: 'How would you keep lint-staged fast on a very large changeset?',
          level: 'expert',
        },
        {
          q: 'How do you avoid partial-stage pitfalls where unstaged changes get linted?',
          level: 'expert',
        },
        {
          q: 'How would you debug lint-staged not picking up certain files?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'acquiapurge',
      name: 'Acquia Purge',
      desc: 'CDN/Varnish cache purging on content save',
      tag: 'Cache',
      questions: [
        {
          q: 'How does drupal/purge work as an abstraction layer for cache invalidation?',
          level: 'intermediate',
        },
        {
          q: "How does drupal/acquia_purge integrate with Acquia's Varnish layer?",
          level: 'intermediate',
        },
        {
          q: 'What is a purge queue and how do you monitor it?',
          level: 'intermediate',
        },
        {
          q: 'How do you manually purge a specific URL or cache tag?',
          level: 'advanced',
        },
        {
          q: 'How do you debug stale CDN content when cache-tag purges are not invalidating?',
          level: 'expert',
        },
        { q: 'What is a CDN?', level: 'novice' },
        { q: 'What is cache invalidation?', level: 'novice' },
        { q: 'What is Varnish?', level: 'novice' },
        {
          q: 'How does the purge queue work and how do you monitor it?',
          level: 'advanced',
        },
        { q: 'How do cache tags drive targeted purges?', level: 'advanced' },
        {
          q: 'How would you debug content staying stale despite purges?',
          level: 'expert',
        },
        {
          q: 'How do you design purging to avoid origin overload after a mass invalidation?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'patches',
      name: 'composer-patches',
      desc: 'Applies Drupal core and contrib patches at install',
      tag: 'Build',
      questions: [
        {
          q: 'How do you add a new patch in composer.json?',
          level: 'advanced',
        },
        {
          q: 'What does the composer-exit-on-patch-failure option do?',
          level: 'advanced',
        },
        {
          q: 'How do you generate a patch from a git diff?',
          level: 'advanced',
        },
        {
          q: 'What happens to patches when you update Drupal core or a module?',
          level: 'advanced',
        },
        {
          q: 'What is your strategy for carrying, documenting, and retiring core/contrib patches across updates?',
          level: 'expert',
        },
        { q: 'What is a patch?', level: 'novice' },
        {
          q: 'Why patch a contrib module instead of editing it directly?',
          level: 'novice',
        },
        { q: 'Where are patches declared in a project?', level: 'novice' },
        {
          q: 'How do you apply a patch with git apply versus patch -p1?',
          level: 'intermediate',
        },
        {
          q: 'How do you apply a patch to a specific module version?',
          level: 'intermediate',
        },
        {
          q: 'How do you handle a patch that no longer applies after an update?',
          level: 'intermediate',
        },
        {
          q: 'How would you track upstream issues so patches can be retired?',
          level: 'expert',
        },
        {
          q: 'How do you manage a large set of patches across many sites?',
          level: 'expert',
        },
      ],
    },
  ],
};
