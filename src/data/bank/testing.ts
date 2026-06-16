import type { Section } from './types.js';

export const testingSection: Section = {
  id: 'testing',
  label: 'Testing',
  icon: '🧪',
  items: [
    {
      id: 'jest',
      name: 'Jest',
      desc: 'Unit testing for JS/Twig with coverage reporting',
      tag: 'Unit Tests',
      questions: [
        {
          q: 'How do you write a basic Jest test and what are matchers?',
          level: 'intermediate',
        },
        {
          q: 'What are mocks, spies, and stubs in Jest and when do you use each?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure Jest to handle SCSS and image imports?',
          level: 'intermediate',
        },
        {
          q: 'How do you set up code coverage and what coverage thresholds make sense?',
          level: 'intermediate',
        },
        {
          q: 'How does twig-testing-library integrate with Jest for Twig component tests?',
          level: 'advanced',
        },
        {
          q: 'How do you test a Drupal behavior that manipulates the DOM using jsdom?',
          level: 'advanced',
        },
        {
          q: 'How would you structure the overall test pyramid across Jest, Storybook, and Drupal PHPUnit/Behat?',
          level: 'expert',
        },
        { q: 'What is unit testing?', level: 'novice' },
        { q: 'What is a test runner?', level: 'novice' },
        { q: 'What is an assertion/matcher?', level: 'novice' },
        {
          q: 'How do you mock ES modules and fake timers in Jest?',
          level: 'advanced',
        },
        {
          q: 'How would you keep a large Jest suite fast (sharding, changed-only, parallelism)?',
          level: 'expert',
        },
        {
          q: 'How do you measure meaningful coverage without gaming the metric?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'storybooktest',
      name: 'Storybook Test Runner',
      desc: 'Automated interaction tests across all stories',
      tag: 'E2E',
      questions: [
        {
          q: 'How does the Storybook test runner work under the hood (Playwright + Jest)?',
          level: 'advanced',
        },
        {
          q: 'How do you write play functions for interaction testing in stories?',
          level: 'advanced',
        },
        {
          q: 'How do you configure the test runner for CI?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between @storybook/test-runner and Chromatic?',
          level: 'intermediate',
        },
        {
          q: 'How do you assert accessibility expectations inside a play function?',
          level: 'intermediate',
        },
        { q: 'What is interaction testing?', level: 'novice' },
        { q: 'What is a play function?', level: 'novice' },
        { q: 'What does the Storybook test runner do?', level: 'novice' },
        {
          q: 'How do you run the test runner against a built Storybook in CI?',
          level: 'advanced',
        },
        {
          q: 'How would you fit Storybook tests into the overall strategy versus E2E tools?',
          level: 'expert',
        },
        {
          q: 'How do you handle flaky interaction tests caused by timing or animation?',
          level: 'expert',
        },
        {
          q: 'How would you parallelise and shard story tests for speed?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'pa11y',
      name: 'Pa11y',
      desc: 'Automated accessibility audits against Storybook',
      tag: 'Accessibility',
      questions: [
        {
          q: 'What accessibility standard does Pa11y check by default (WCAG 2.1 AA)?',
          level: 'intermediate',
        },
        {
          q: 'How is Pa11y configured to crawl the Storybook build in this project?',
          level: 'intermediate',
        },
        {
          q: 'How do you ignore a Pa11y rule for a specific component?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between Pa11y and the Storybook a11y addon?',
          level: 'novice',
        },
        {
          q: 'How do you wire Pa11y/axe into CI so the build fails only on newly introduced violations?',
          level: 'advanced',
        },
        { q: 'What is web accessibility (a11y)?', level: 'novice' },
        { q: 'What does Pa11y check?', level: 'novice' },
        {
          q: 'How do you configure rules and responsibly ignore false positives?',
          level: 'advanced',
        },
        {
          q: 'How do you run Pa11y across many URLs or stories?',
          level: 'advanced',
        },
        {
          q: 'How would you enforce a11y in CI without blocking on pre-existing debt?',
          level: 'expert',
        },
        {
          q: 'How do you cover issues automated tools miss (keyboard, screen reader)?',
          level: 'expert',
        },
        {
          q: 'How would you track and burn down an a11y backlog across a large site?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'storycap',
      name: 'Storycap + Pixelmatch',
      desc: 'Screenshot capture and visual regression',
      tag: 'Visual Regression',
      questions: [
        {
          q: 'How does Storycap capture screenshots of each Storybook story?',
          level: 'intermediate',
        },
        {
          q: 'How does Pixelmatch compare screenshots and what is a pixel threshold?',
          level: 'intermediate',
        },
        {
          q: 'How do you update baseline screenshots after an intentional design change?',
          level: 'intermediate',
        },
        {
          q: 'What are the challenges of visual regression testing in CI (fonts, timing)?',
          level: 'intermediate',
        },
        {
          q: 'How do you make visual regression deterministic (fonts, animation, network) to avoid flaky diffs?',
          level: 'expert',
        },
        { q: 'What is visual regression testing?', level: 'novice' },
        { q: 'What does Storycap do?', level: 'novice' },
        { q: 'What is a baseline screenshot?', level: 'novice' },
        {
          q: 'How do you reduce false diffs from fonts and anti-aliasing?',
          level: 'advanced',
        },
        {
          q: 'How do you scope captures to specific viewports and states?',
          level: 'advanced',
        },
        {
          q: 'How do you review and approve intentional visual changes?',
          level: 'advanced',
        },
        {
          q: 'How would you make visual tests deterministic across local and CI runners?',
          level: 'expert',
        },
        {
          q: 'How do you scale visual testing across hundreds of stories without slowing CI?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'puppeteer',
      name: 'Puppeteer',
      desc: 'Headless Chrome for screenshot and a11y scripts',
      tag: 'Automation',
      questions: [
        {
          q: 'How do you navigate to a page and wait for it to load in Puppeteer?',
          level: 'intermediate',
        },
        {
          q: 'How is Puppeteer used in the a11y.js script in this project?',
          level: 'intermediate',
        },
        {
          q: 'What is the difference between page.evaluate() and page.$()?',
          level: 'novice',
        },
        {
          q: 'How do you handle authentication in a Puppeteer script?',
          level: 'intermediate',
        },
        {
          q: 'How do you authenticate once and persist a session across Puppeteer runs?',
          level: 'advanced',
        },
        { q: 'What is a headless browser?', level: 'novice' },
        { q: 'What is Puppeteer?', level: 'novice' },
        {
          q: 'How do you wait reliably for elements/network instead of fixed timeouts?',
          level: 'advanced',
        },
        {
          q: 'How do you capture and assert console errors during a run?',
          level: 'advanced',
        },
        {
          q: 'How would you run Puppeteer reliably in CI/Docker (sandbox, fonts, memory)?',
          level: 'expert',
        },
        {
          q: 'How do you parallelise many browser sessions without flakiness?',
          level: 'expert',
        },
        {
          q: 'How would you debug a script that passes locally but fails in CI?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'drupalspec',
      name: 'Drupal Spec Tool',
      desc: 'Behat-based Drupal config specification tests',
      tag: 'Integration',
      questions: [
        {
          q: 'What is acquia/drupal-spec-tool and what does it test?',
          level: 'novice',
        },
        {
          q: 'How do you write a Drupal spec feature file for a content type?',
          level: 'intermediate',
        },
        {
          q: 'How do spec tests run in CI and what happens when they fail?',
          level: 'intermediate',
        },
        {
          q: 'How do you keep spec tests in sync as content types evolve?',
          level: 'intermediate',
        },
        {
          q: 'How do you regenerate the spec from the current site configuration?',
          level: 'intermediate',
        },
        { q: 'What is the Drupal Spec Tool?', level: 'novice' },
        { q: 'What does it verify about site configuration?', level: 'novice' },
        {
          q: 'How do you generate spec features from existing config?',
          level: 'advanced',
        },
        {
          q: 'How do you keep the spec in sync as content types evolve?',
          level: 'advanced',
        },
        {
          q: 'How do you run the spec in CI and interpret failures?',
          level: 'advanced',
        },
        {
          q: 'How would you decide what to cover with spec tests versus other tests?',
          level: 'expert',
        },
        {
          q: 'How do you handle config that legitimately differs per environment?',
          level: 'expert',
        },
        {
          q: 'How would you scale spec coverage without it becoming brittle?',
          level: 'expert',
        },
      ],
    },
  ],
};
