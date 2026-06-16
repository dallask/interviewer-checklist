import type { Section } from './types.js';

export const toolingSection: Section = {
  id: 'tooling',
  label: 'Tooling',
  icon: '🔧',
  items: [
    {
      id: 'eslint',
      name: 'ESLint',
      desc: 'JS linting with airbnb-base, security, jest plugins',
      tag: 'Linting',
      questions: [
        {
          q: 'What is the difference between extending a config and adding plugins?',
          level: 'novice',
        },
        {
          q: 'How do you disable an ESLint rule for a single line vs a whole file?',
          level: 'intermediate',
        },
        { q: 'What does eslint-plugin-security check for?', level: 'novice' },
        {
          q: 'How does eslint-config-prettier prevent conflicts with Prettier?',
          level: 'intermediate',
        },
        {
          q: 'How do you add a custom rule or shareable config?',
          level: 'advanced',
        },
        {
          q: 'How do you share one ESLint config across packages and override rules per folder?',
          level: 'advanced',
        },
        { q: 'What is linting?', level: 'novice' },
        {
          q: 'How do you run ESLint and auto-fix issues?',
          level: 'intermediate',
        },
        {
          q: 'How do you scope rules per environment (browser vs node vs tests)?',
          level: 'advanced',
        },
        {
          q: 'How would you migrate to ESLint flat config and shared presets across packages?',
          level: 'expert',
        },
        {
          q: 'How do you write a custom rule to enforce a project convention?',
          level: 'expert',
        },
        {
          q: 'How would you keep ESLint fast on a large codebase in CI?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'stylelint',
      name: 'Stylelint',
      desc: 'SCSS linting with standard-scss + BEM pattern',
      tag: 'Linting',
      questions: [
        {
          q: 'How do you configure stylelint-config-standard-scss for this project?',
          level: 'intermediate',
        },
        {
          q: 'How does stylelint-selector-bem-pattern enforce BEM class naming?',
          level: 'intermediate',
        },
        {
          q: 'How do you disable a Stylelint rule inline?',
          level: 'intermediate',
        },
        {
          q: 'How does stylelint-prettier integrate Prettier formatting into Stylelint?',
          level: 'intermediate',
        },
        {
          q: 'How would you write a plugin/rule that enforces design-token usage instead of raw hex values?',
          level: 'advanced',
        },
        { q: 'What does Stylelint do?', level: 'novice' },
        {
          q: 'What is the difference between linting and formatting?',
          level: 'novice',
        },
        { q: 'What is a Stylelint config?', level: 'novice' },
        {
          q: 'How do you enforce ordering or grouping of declarations?',
          level: 'advanced',
        },
        {
          q: 'How do you integrate Stylelint with SCSS and ignore generated files?',
          level: 'advanced',
        },
        {
          q: 'How would you enforce design-token usage and ban raw values via Stylelint?',
          level: 'expert',
        },
        { q: 'How do you write a custom Stylelint plugin?', level: 'expert' },
        {
          q: 'How would you roll out stricter rules to a legacy codebase incrementally?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'prettier',
      name: 'Prettier',
      desc: 'Opinionated formatter for JS, SCSS, YAML, Markdown',
      tag: 'Formatting',
      questions: [
        {
          q: "What is Prettier's key design principle and why does it reduce debates?",
          level: 'novice',
        },
        {
          q: 'How do you configure Prettier via .prettierrc.json?',
          level: 'intermediate',
        },
        {
          q: 'How does --ignore-unknown affect unknown file types?',
          level: 'intermediate',
        },
        {
          q: 'How do you integrate Prettier into VS Code auto-format on save?',
          level: 'intermediate',
        },
        {
          q: 'How do you resolve formatting conflicts between Prettier and ESLint/Stylelint?',
          level: 'intermediate',
        },
        { q: 'What is Prettier?', level: 'novice' },
        { q: 'How does formatting differ from linting?', level: 'novice' },
        {
          q: 'How do you integrate Prettier with ESLint/Stylelint without conflicts?',
          level: 'advanced',
        },
        {
          q: 'How do you format only changed files in a hook?',
          level: 'advanced',
        },
        {
          q: 'How do you exclude files or sections that should not be formatted?',
          level: 'advanced',
        },
        {
          q: 'How would you roll Prettier out to a legacy codebase (one big diff vs incremental)?',
          level: 'expert',
        },
        {
          q: 'How do you keep editor, CLI, and CI formatting identical?',
          level: 'expert',
        },
        {
          q: 'How would you extend Prettier for an unsupported syntax?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'drupalsniffer',
      name: 'Drupal Coder',
      desc: 'PHP CodeSniffer rules for Drupal coding standards',
      tag: 'Linting',
      questions: [
        {
          q: 'How do you run PHPCS with Drupal standards?',
          level: 'intermediate',
        },
        {
          q: 'How do you auto-fix violations using phpcbf?',
          level: 'intermediate',
        },
        {
          q: 'How do you add a PHPCS ignore comment for a specific line?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure PHPCS in a project-level ruleset.xml?',
          level: 'intermediate',
        },
        {
          q: 'How do you add PHPStan/phpstan-drupal alongside PHPCS, and at what analysis level do you start?',
          level: 'advanced',
        },
        { q: 'What are coding standards?', level: 'novice' },
        { q: 'What is PHP_CodeSniffer (PHPCS)?', level: 'novice' },
        { q: 'What is the Drupal Coder package?', level: 'novice' },
        {
          q: 'How do you configure a project ruleset.xml and exclude paths?',
          level: 'advanced',
        },
        {
          q: 'How do you integrate PHPCS/phpcbf into pre-commit and CI?',
          level: 'advanced',
        },
        {
          q: 'How would you add PHPStan/phpstan-drupal and raise the level over time?',
          level: 'expert',
        },
        {
          q: 'How do you handle a large backlog of legacy violations without blocking work?',
          level: 'expert',
        },
        {
          q: 'How would you enforce standards consistently across many repositories?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'kint',
      name: 'Kint (PHP)',
      desc: 'Enhanced variable dumper for Drupal debugging',
      tag: 'Debugging',
      questions: [
        {
          q: 'How do you use Kint inside a Drupal Twig template?',
          level: 'intermediate',
        },
        {
          q: 'How do you use kint() in a PHP preprocess function?',
          level: 'intermediate',
        },
        {
          q: 'How do you limit Kint output depth to avoid browser crashes on large objects?',
          level: 'intermediate',
        },
        {
          q: 'How do you enable Devel/Kint safely so debug output never leaks into production?',
          level: 'novice',
        },
        { q: 'What is Kint?', level: 'novice' },
        { q: 'What is the Devel module?', level: 'novice' },
        {
          q: 'How do you dump a render array safely without crashing the page?',
          level: 'advanced',
        },
        {
          q: 'How do you limit Kint depth on huge objects?',
          level: 'advanced',
        },
        {
          q: 'How do you use Kint inside Twig versus a PHP preprocess function?',
          level: 'advanced',
        },
        {
          q: 'How would you ensure debug tooling is never enabled in production?',
          level: 'expert',
        },
        {
          q: "How do you investigate issues that dumpers and debuggers can't reveal?",
          level: 'expert',
        },
        {
          q: 'How would you set up structured logging instead of dump-debugging?',
          level: 'expert',
        },
      ],
    },
  ],
};
