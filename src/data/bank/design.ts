import type { Section } from './types.js';

export const designSection: Section = {
  id: 'design',
  label: 'Design',
  icon: '🎨',
  items: [
    {
      id: 'figma',
      name: 'Figma',
      desc: 'Primary design tool, exports tokens via Figma Tokens plugin',
      tag: 'Design',
      questions: [
        {
          q: 'How do you export design tokens from Figma using the Figma Tokens plugin?',
          level: 'intermediate',
        },
        {
          q: 'What is the relationship between Figma components and design system components?',
          level: 'novice',
        },
        {
          q: 'How do Figma variants map to SCSS modifiers?',
          level: 'intermediate',
        },
        {
          q: 'How do you handle design handoff for a complex component?',
          level: 'intermediate',
        },
        {
          q: 'How do you keep Figma variables/tokens in sync with the codebase when designers change values?',
          level: 'advanced',
        },
        { q: 'What is Figma and why is it browser-based?', level: 'novice' },
        {
          q: 'What is the difference between a Figma component and an instance?',
          level: 'novice',
        },
        {
          q: 'How do you structure a Figma library so tokens and components stay maintainable?',
          level: 'advanced',
        },
        {
          q: 'How do you keep Figma naming aligned with code component names?',
          level: 'advanced',
        },
        {
          q: 'How would you automate token export from Figma into CI?',
          level: 'expert',
        },
        {
          q: 'How do you manage breaking design changes across many consuming files?',
          level: 'expert',
        },
        {
          q: 'How would you reconcile Figma variables/modes with a multi-theme token pipeline?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'tokens',
      name: 'Design Tokens',
      desc: 'Colors, spacing, typography, shadows exported as JSON',
      tag: 'Tokens',
      questions: [
        {
          q: 'What are design tokens and why are they valuable in a design system?',
          level: 'novice',
        },
        {
          q: 'How are token references ($) resolved between core and component token sets?',
          level: 'intermediate',
        },
        {
          q: 'How do you add a new token category and propagate it to SCSS and CSS?',
          level: 'intermediate',
        },
        {
          q: 'What is the token-transformer pre-processing step and why is it needed before Style Dictionary?',
          level: 'intermediate',
        },
        {
          q: 'How would you model multi-brand token sets (alias/reference layers) so one pipeline emits several themes?',
          level: 'expert',
        },
        { q: 'What is a design token?', level: 'novice' },
        {
          q: 'Give examples of token categories (color, spacing, type).',
          level: 'novice',
        },
        {
          q: 'How do you structure global, alias, and component tokens?',
          level: 'advanced',
        },
        {
          q: 'How do reference ($) tokens resolve and what breaks if a reference is missing?',
          level: 'advanced',
        },
        {
          q: 'How do you propagate a new token to SCSS, CSS vars, and docs in one pipeline?',
          level: 'advanced',
        },
        {
          q: 'How would you support themes/modes purely through token layers?',
          level: 'expert',
        },
        {
          q: 'How do you prevent token drift between design and code at scale?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'styledictionary',
      name: 'Style Dictionary',
      desc: 'Transforms Figma token JSON into SCSS variables and CSS custom properties',
      tag: 'Tokens',
      questions: [
        {
          q: "What is Style Dictionary's transform pipeline (attribute → name → value)?",
          level: 'novice',
        },
        {
          q: 'How do you define a custom transform (e.g., pxToRem) in the tokens config?',
          level: 'expert',
        },
        {
          q: 'What is the difference between transforms and transformGroups?',
          level: 'novice',
        },
        {
          q: 'How do you generate both SCSS map and CSS :root output from the same tokens?',
          level: 'intermediate',
        },
        {
          q: "How does the excludeTokens filter work in this project's configuration?",
          level: 'advanced',
        },
        {
          q: 'How do you add a custom format or transform that outputs both CSS custom properties and a SCSS map?',
          level: 'advanced',
        },
        {
          q: 'What does Style Dictionary do at a high level?',
          level: 'novice',
        },
        {
          q: 'How do you configure a platform and a file output in Style Dictionary?',
          level: 'intermediate',
        },
        {
          q: 'How do you run Style Dictionary as part of the build?',
          level: 'intermediate',
        },
        {
          q: 'How do you write and register a custom transform such as px-to-rem?',
          level: 'advanced',
        },
        {
          q: 'How would you output multiple themes from one source with minimal duplication?',
          level: 'expert',
        },
        {
          q: 'How would you debug a transform producing wrong values for a subset of tokens?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'storybook',
      name: 'Storybook 7',
      desc: 'Component explorer with a11y, docs, and design token addons',
      tag: 'Component Library',
      questions: [
        {
          q: 'What is a Story and how do you write args-based stories?',
          level: 'novice',
        },
        {
          q: 'What are Storybook decorators and when would you use one?',
          level: 'expert',
        },
        {
          q: 'How does the @storybook/html package differ from @storybook/react?',
          level: 'intermediate',
        },
        {
          q: 'How are Storybook docs pages generated from component comments?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure Storybook to use Webpack 5 as its bundler?',
          level: 'advanced',
        },
        {
          q: "How do you document a component's args using argTypes and controls?",
          level: 'intermediate',
        },
        {
          q: 'How do you mock Drupal-specific Twig functions and filters inside Storybook stories?',
          level: 'advanced',
        },
        {
          q: 'What is Storybook and what problem does it solve?',
          level: 'novice',
        },
        { q: "What is a 'story'?", level: 'novice' },
        {
          q: 'How do you share decorators and parameters globally via preview.js?',
          level: 'advanced',
        },
        {
          q: 'How would you integrate Storybook with Drupal Twig and drupalSettings mocking at scale?',
          level: 'expert',
        },
        {
          q: 'How do you set up Storybook composition across multiple design-system packages?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'normalize',
      name: 'Normalize.css',
      desc: 'Cross-browser CSS reset baseline',
      tag: 'Styles',
      questions: [
        {
          q: 'What problem does Normalize.css solve compared to a full CSS reset?',
          level: 'intermediate',
        },
        {
          q: 'Where is Normalize.css loaded in the build pipeline?',
          level: 'advanced',
        },
        {
          q: 'Why is Normalize.css loaded before component styles in the cascade?',
          level: 'novice',
        },
        { q: 'What is a CSS reset?', level: 'novice' },
        { q: 'What is Normalize.css?', level: 'novice' },
        {
          q: 'How is Normalize.css added to a build pipeline?',
          level: 'intermediate',
        },
        {
          q: 'How does Normalize differ from a hard reset like reset.css?',
          level: 'intermediate',
        },
        {
          q: 'What specific cross-browser inconsistencies does Normalize address?',
          level: 'advanced',
        },
        {
          q: 'How do you add your own base element defaults without conflicting with Normalize?',
          level: 'advanced',
        },
        {
          q: 'How would you choose between Normalize, a modern reset, or none for a design system?',
          level: 'expert',
        },
        {
          q: 'How do you stop base styles from leaking into and fighting component styles?',
          level: 'expert',
        },
        {
          q: 'How would you audit and trim unused base styles in a large theme?',
          level: 'expert',
        },
      ],
    },
  ],
};
