import type { Section } from './types.js';

export const frontendSection: Section = {
  id: 'frontend',
  label: 'Frontend',
  icon: '🖥️',
  items: [
    {
      id: 'twig',
      name: 'Twig',
      desc: 'PHP templating for Drupal theme components',
      tag: 'Templating',
      questions: [
        {
          q: 'What is the difference between include, embed, and extends in Twig?',
          level: 'novice',
        },
        {
          q: 'How does Drupal generate theme suggestions to select the correct template?',
          level: 'intermediate',
        },
        {
          q: 'How do you pass variables from a preprocess hook to a Twig template?',
          level: 'intermediate',
        },
        {
          q: 'What are Twig filters and how do you register a custom one in Drupal?',
          level: 'intermediate',
        },
        {
          q: 'How does Emulsify bridge component Twig templates with Storybook stories?',
          level: 'advanced',
        },
        {
          q: 'How do you create and use a custom Twig namespace (e.g. @components) for includes?',
          level: 'advanced',
        },
        {
          q: 'How does Twig autoescaping work in Drupal, and when is |raw or a Markup object appropriate (and risky)?',
          level: 'expert',
        },
        {
          q: 'What is a Twig template and how does it differ from a plain PHP template?',
          level: 'novice',
        },
        {
          q: 'What is the difference between {{ ... }} output and {% ... %} tags?',
          level: 'novice',
        },
        {
          q: 'How do you use Twig debug mode and dump() to find which template and variables are active?',
          level: 'advanced',
        },
        {
          q: 'How would you build a reusable, prop-driven component macro library in Twig?',
          level: 'expert',
        },
        {
          q: 'How does Twig compile templates to PHP, and what are the caching implications?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'scss',
      name: 'SCSS / Sass',
      desc: 'Primary stylesheet language with BEM and design tokens',
      tag: 'Styles',
      questions: [
        {
          q: 'What is the difference between @use and @import in modern Sass?',
          level: 'novice',
        },
        {
          q: 'How do you structure partials across a large Drupal theme?',
          level: 'intermediate',
        },
        {
          q: 'Explain mixins vs functions — when would you use each?',
          level: 'intermediate',
        },
        {
          q: 'How do SCSS variables differ from CSS custom properties, and when do you prefer each?',
          level: 'intermediate',
        },
        {
          q: 'How does the breakpoint-sass library work and how do you write responsive rules?',
          level: 'advanced',
        },
        {
          q: 'How do you prevent specificity wars when layering Bootstrap, Emulsify, and custom component styles?',
          level: 'advanced',
        },
        {
          q: 'How would you structure a scalable SCSS architecture (ITCSS / 7-1) across multiple themes?',
          level: 'expert',
        },
        {
          q: 'What is a SCSS partial and how is it imported?',
          level: 'novice',
        },
        {
          q: 'What is nesting in SCSS and what is the danger of over-nesting?',
          level: 'novice',
        },
        {
          q: 'How do you build a responsive spacing and type scale using maps and loops?',
          level: 'advanced',
        },
        {
          q: 'How would you support runtime dark mode via CSS custom properties driven by SCSS tokens?',
          level: 'expert',
        },
        {
          q: 'How do you remove dead CSS at scale without dropping dynamically added classes?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'js',
      name: 'JavaScript (ES6+)',
      desc: 'Vanilla JS with ES6 modules and Babel transpilation',
      tag: 'Language',
      questions: [
        {
          q: 'What is a Drupal behavior and why is it used instead of $(document).ready()?',
          level: 'novice',
        },
        {
          q: 'How do you handle async operations — Promises vs async/await?',
          level: 'advanced',
        },
        {
          q: 'Explain destructuring, spread, and rest operators with examples.',
          level: 'intermediate',
        },
        {
          q: 'What is the module pattern and how does it relate to ES6 import/export?',
          level: 'intermediate',
        },
        {
          q: 'How do you debounce or throttle event handlers?',
          level: 'advanced',
        },
        {
          q: 'How do you pass server-side values to JavaScript using drupalSettings?',
          level: 'intermediate',
        },
        {
          q: 'How do you ensure a behavior attached to AJAX-loaded content initialises exactly once with once()?',
          level: 'advanced',
        },
        {
          q: 'What is the difference between let, const, and var?',
          level: 'novice',
        },
        {
          q: 'What is the difference between == and === in JavaScript?',
          level: 'novice',
        },
        {
          q: 'How would you architect a small framework-less component system with state and events?',
          level: 'expert',
        },
        {
          q: 'How do you prevent memory leaks from listeners on detached DOM in long-lived pages?',
          level: 'expert',
        },
        {
          q: 'How would you apply progressive enhancement so core content works without JS?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'bootstrap',
      name: 'Bootstrap 5',
      desc: 'CSS framework used as a layout and utility base',
      tag: 'Framework',
      questions: [
        {
          q: 'How does the Bootstrap 5 grid system work (breakpoints, columns, gutters)?',
          level: 'intermediate',
        },
        {
          q: 'How do you override Bootstrap variables in an SCSS-based theme?',
          level: 'advanced',
        },
        {
          q: 'What changed between Bootstrap 4 and 5 (no jQuery dependency, RTL, etc.)?',
          level: 'intermediate',
        },
        {
          q: 'How do you tree-shake Bootstrap to include only what you need in Webpack?',
          level: 'expert',
        },
        {
          q: 'What Bootstrap JS components are used in this project and how are they initialized?',
          level: 'advanced',
        },
        {
          q: 'How do you decide between a Bootstrap utility class and writing custom SCSS?',
          level: 'intermediate',
        },
        {
          q: 'What is Bootstrap and what does it provide out of the box?',
          level: 'novice',
        },
        {
          q: 'What are containers, rows, and columns in Bootstrap?',
          level: 'novice',
        },
        {
          q: 'What are Bootstrap breakpoints (sm, md, lg, xl, xxl)?',
          level: 'novice',
        },
        {
          q: 'How do you customise Bootstrap Sass maps such as $theme-colors and $grid-breakpoints?',
          level: 'advanced',
        },
        {
          q: 'How would you ship only the Bootstrap layers a design system uses to minimise CSS weight?',
          level: 'expert',
        },
        {
          q: 'How do you reconcile Bootstrap’s global styles with scoped component styles?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'webpack',
      name: 'Webpack 5',
      desc: 'Module bundler with dev/prod configs',
      tag: 'Bundler',
      questions: [
        {
          q: 'What is the difference between a Webpack loader and a plugin?',
          level: 'novice',
        },
        {
          q: 'How does webpack-merge split dev and production configurations?',
          level: 'intermediate',
        },
        {
          q: 'How does code splitting / lazy loading work in Webpack 5?',
          level: 'advanced',
        },
        {
          q: 'What is the purpose of MiniCssExtractPlugin vs style-loader?',
          level: 'novice',
        },
        {
          q: 'How does the SVG sprite loader work and how do you reference sprites in templates?',
          level: 'advanced',
        },
        {
          q: 'How would you diagnose and reduce an oversized production bundle (source-map-explorer, splitChunks, externals)?',
          level: 'expert',
        },
        {
          q: 'What is a module bundler and why is one needed?',
          level: 'novice',
        },
        {
          q: 'How do you define multiple entry points in Webpack?',
          level: 'intermediate',
        },
        {
          q: 'How do you add content hashes to output filenames for cache busting?',
          level: 'intermediate',
        },
        {
          q: 'How do you split vendor code from app code using splitChunks?',
          level: 'advanced',
        },
        {
          q: 'How would you set up shared dependencies or module federation across builds?',
          level: 'expert',
        },
        {
          q: 'How do you diagnose a slow Webpack build and speed up incremental rebuilds?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'postcss',
      name: 'PostCSS',
      desc: 'CSS post-processing: autoprefixer, px-to-rem',
      tag: 'Styles',
      questions: [
        {
          q: 'What is PostCSS and how does it differ from Sass?',
          level: 'novice',
        },
        {
          q: 'How does autoprefixer know which browsers to target?',
          level: 'intermediate',
        },
        {
          q: 'What does postcss-pxtorem do and when would you disable it for a specific value?',
          level: 'intermediate',
        },
        {
          q: 'How does postcss-scss allow PostCSS to process SCSS syntax?',
          level: 'intermediate',
        },
        { q: 'What is a PostCSS plugin?', level: 'novice' },
        {
          q: 'Why might a project use both Sass and PostCSS together?',
          level: 'novice',
        },
        {
          q: 'How does plugin order in a PostCSS pipeline affect the output?',
          level: 'advanced',
        },
        {
          q: 'How do you drive autoprefixer and other plugins from browserslist?',
          level: 'advanced',
        },
        {
          q: 'How do you write a small custom PostCSS plugin to transform declarations?',
          level: 'advanced',
        },
        {
          q: 'How would you build a logical-properties/RTL transform via PostCSS?',
          level: 'expert',
        },
        {
          q: 'How do you keep PostCSS output consistent between Webpack and a CLI build?',
          level: 'expert',
        },
        {
          q: 'How would you debug a PostCSS plugin producing wrong output on an edge case?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'babel',
      name: 'Babel',
      desc: 'JS transpiler with React and minify presets',
      tag: 'Tooling',
      questions: [
        {
          q: 'What is the difference between a Babel preset and a plugin?',
          level: 'novice',
        },
        {
          q: 'Why is @babel/preset-react included in this project despite no React components?',
          level: 'novice',
        },
        {
          q: 'How does babel-preset-minify work and when do you use it?',
          level: 'intermediate',
        },
        {
          q: 'What is regenerator-runtime and why is it needed?',
          level: 'novice',
        },
        {
          q: 'How do you target browsers using @babel/preset-env and browserslist?',
          level: 'intermediate',
        },
        {
          q: 'How do you configure Babel via babel.config.js versus .babelrc?',
          level: 'intermediate',
        },
        {
          q: 'How do polyfills get injected (useBuiltIns usage vs entry) and what are the trade-offs?',
          level: 'advanced',
        },
        {
          q: 'How do you write a simple custom Babel plugin that transforms an AST node?',
          level: 'advanced',
        },
        {
          q: 'How does Babel interact with Webpack via babel-loader and caching?',
          level: 'advanced',
        },
        {
          q: 'How would you debug a transform that breaks only in minified production builds?',
          level: 'expert',
        },
        {
          q: 'How do you keep bundle size down while supporting old browsers (differential serving)?',
          level: 'expert',
        },
        {
          q: 'How would you migrate a large Babel config to swc/esbuild and what are the risks?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'emulsify',
      name: 'Emulsify Design System',
      desc: 'Drupal component system built on atomic design',
      tag: 'Design System',
      questions: [
        {
          q: 'What problem does Emulsify solve in a Drupal project?',
          level: 'intermediate',
        },
        {
          q: 'How does the emulsify-compound system.emulsify.json file define the component structure?',
          level: 'intermediate',
        },
        {
          q: 'How do you add a new component — what files are needed?',
          level: 'intermediate',
        },
        {
          q: 'How does Emulsify handle the Drupal/Storybook parity gap?',
          level: 'intermediate',
        },
        {
          q: 'What is the Emulsify component registry used for?',
          level: 'novice',
        },
        {
          q: "How do you keep a component's Drupal Twig template and its Storybook story from drifting apart?",
          level: 'advanced',
        },
        {
          q: 'What is a design system and what role does Emulsify play?',
          level: 'novice',
        },
        { q: "What is Storybook's role within Emulsify?", level: 'novice' },
        {
          q: "How do you wire a component's data, SCSS, and JS so it works in both Drupal and Storybook?",
          level: 'advanced',
        },
        {
          q: 'How do you override or extend an Emulsify base component in a subtheme?',
          level: 'advanced',
        },
        {
          q: 'How would you govern breaking changes to components shared by multiple sites?',
          level: 'expert',
        },
        {
          q: 'How do you keep the component library, Drupal templates, and Figma in sync?',
          level: 'expert',
        },
        {
          q: 'How would you add automated visual and a11y gates for every component in CI?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'bem',
      name: 'BEM Methodology',
      desc: 'Block-Element-Modifier naming enforced via stylelint',
      tag: 'Architecture',
      questions: [
        {
          q: 'Explain the BEM naming convention with a concrete example.',
          level: 'intermediate',
        },
        {
          q: 'How do you handle modifiers that combine multiple styles?',
          level: 'intermediate',
        },
        {
          q: 'How is stylelint-selector-bem-pattern configured to enforce BEM?',
          level: 'intermediate',
        },
        { q: 'When would you break BEM rules and why?', level: 'intermediate' },
        {
          q: 'How do you reconcile BEM with utility classes and the classes Drupal injects into rendered markup?',
          level: 'expert',
        },
        { q: 'What does BEM stand for?', level: 'novice' },
        { q: "What is a 'block' in BEM?", level: 'novice' },
        {
          q: 'What is the difference between an element and a modifier?',
          level: 'novice',
        },
        {
          q: 'How do you avoid deep element chains like block__a__b and keep BEM flat?',
          level: 'advanced',
        },
        {
          q: 'How do you express component state (is-active, has-error) alongside BEM modifiers?',
          level: 'advanced',
        },
        {
          q: 'How do you structure SCSS so each BEM block is self-contained?',
          level: 'advanced',
        },
        {
          q: 'How would you enforce BEM automatically in CI while migrating legacy code incrementally?',
          level: 'expert',
        },
        {
          q: 'How do you scale BEM naming to avoid collisions across many shared components?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'atomic',
      name: 'Atomic Design',
      desc: 'Component hierarchy: base → atoms → molecules → organisms → pages',
      tag: 'Architecture',
      questions: [
        {
          q: 'Describe the 6 atomic design levels used in this project.',
          level: 'novice',
        },
        {
          q: 'Give an example of composing molecules from atoms in the codebase.',
          level: 'intermediate',
        },
        {
          q: 'How do you decide when a component should be promoted from molecule to organism?',
          level: 'intermediate',
        },
        {
          q: "How does atomic design interact with Drupal's block/template system?",
          level: 'intermediate',
        },
        { q: 'What is atomic design?', level: 'novice' },
        {
          q: 'What is the difference between an atom and a molecule?',
          level: 'novice',
        },
        {
          q: 'How do you keep organisms from coupling too tightly to a single page?',
          level: 'advanced',
        },
        {
          q: 'How do you decide what becomes a shared component versus a one-off?',
          level: 'advanced',
        },
        {
          q: 'How do you map Drupal entities and view modes onto atomic components?',
          level: 'advanced',
        },
        {
          q: 'How would you version and deprecate components across atomic levels without breaking consumers?',
          level: 'expert',
        },
        {
          q: 'How do you prevent an explosion of tiny, hard-to-find components?',
          level: 'expert',
        },
        {
          q: 'How would you measure reuse and find redundant components in a large library?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'jquery',
      name: 'jQuery',
      desc: 'Used for Drupal behaviors and plugin interop',
      tag: 'Library',
      questions: [
        {
          q: "How does Drupal's behavior system use jQuery.once() (now @drupal/once)?",
          level: 'advanced',
        },
        {
          q: 'When is it appropriate to write new jQuery code vs vanilla JS?',
          level: 'intermediate',
        },
        {
          q: 'How do you avoid jQuery conflicts in a Drupal context?',
          level: 'intermediate',
        },
        {
          q: 'How would you migrate a legacy jQuery behavior to vanilla JS without breaking the once() pattern?',
          level: 'advanced',
        },
        { q: 'What is jQuery and why has its use declined?', level: 'novice' },
        { q: 'What does the $ function do?', level: 'novice' },
        { q: 'What is a selector in jQuery?', level: 'novice' },
        {
          q: 'How do you delegate events to dynamically added elements in jQuery?',
          level: 'intermediate',
        },
        {
          q: 'How do you remove jQuery dependencies from a theme incrementally?',
          level: 'advanced',
        },
        {
          q: 'How would you audit a large codebase for jQuery usage and plan a phased removal?',
          level: 'expert',
        },
        {
          q: 'How do you avoid double-initialisation when jQuery and vanilla behaviors coexist?',
          level: 'expert',
        },
        {
          q: "How would you reimplement a jQuery plugin's behaviour in vanilla JS without regressions?",
          level: 'expert',
        },
      ],
    },
    {
      id: 'lottie',
      name: 'Lottie Player',
      desc: 'JSON-based animation rendering',
      tag: 'Animation',
      questions: [
        {
          q: 'What format do Lottie animations use and how are they exported from design tools?',
          level: 'intermediate',
        },
        {
          q: 'How do you control playback (play, pause, loop) via the Lottie Player API?',
          level: 'intermediate',
        },
        {
          q: 'How do you optimize Lottie file size for production?',
          level: 'advanced',
        },
        { q: 'What is Lottie?', level: 'novice' },
        { q: 'What file format does Lottie use?', level: 'novice' },
        {
          q: 'Where do Lottie animations typically come from?',
          level: 'novice',
        },
        {
          q: 'How do you lazy-load a Lottie animation so it does not block initial render?',
          level: 'intermediate',
        },
        {
          q: 'How do you trigger Lottie playback on scroll or interaction?',
          level: 'advanced',
        },
        {
          q: 'How do you make Lottie animations respect prefers-reduced-motion?',
          level: 'advanced',
        },
        {
          q: 'How would you budget and optimise many Lottie animations on one page?',
          level: 'expert',
        },
        {
          q: 'How do you handle Lottie accessibility (pausing, fallbacks, announcements)?',
          level: 'expert',
        },
        {
          q: 'How would you debug a Lottie file that renders differently than the design?',
          level: 'expert',
        },
      ],
    },
    {
      id: 'browsersync',
      name: 'BrowserSync',
      desc: 'Live-reload integrated with DDEV',
      tag: 'DX',
      questions: [
        {
          q: 'How does BrowserSync proxy a DDEV site for live reloading?',
          level: 'intermediate',
        },
        {
          q: 'How is BrowserSync integrated with Webpack and DDEV in this project?',
          level: 'intermediate',
        },
        {
          q: "What is the difference between BrowserSync's proxy mode and server mode?",
          level: 'novice',
        },
        { q: 'What is BrowserSync?', level: 'novice' },
        {
          q: 'What does live-reload give you during development?',
          level: 'novice',
        },
        {
          q: 'How do you sync interactions across multiple devices with BrowserSync?',
          level: 'intermediate',
        },
        {
          q: 'How do you integrate BrowserSync with a Webpack watch build behind a DDEV proxy?',
          level: 'advanced',
        },
        {
          q: 'How do you inject only changed CSS instead of doing a full reload?',
          level: 'advanced',
        },
        {
          q: 'How do you configure BrowserSync to ignore certain files or paths?',
          level: 'advanced',
        },
        {
          q: 'How would you debug BrowserSync not reloading behind a reverse proxy or HTTPS?',
          level: 'expert',
        },
        {
          q: 'How do you script a reliable multi-tool dev pipeline (Webpack + BrowserSync + Drush)?',
          level: 'expert',
        },
        {
          q: 'How would you replace BrowserSync with Webpack Dev Server/HMR and what changes?',
          level: 'expert',
        },
      ],
    },
  ],
};
