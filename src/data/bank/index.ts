import { aiSection } from './ai.js';
import { backendSection } from './backend.js';
import { cicdSection } from './cicd.js';
import { designSection } from './design.js';
import { environmentSection } from './environment.js';
import { frontendSection } from './frontend.js';
import { integrationsSection } from './integrations.js';
import { testingSection } from './testing.js';
import { toolingSection } from './tooling.js';
import type { Section } from './types.js';

export const DEFAULT_SECTIONS: readonly Section[] = [
  frontendSection,
  designSection,
  backendSection,
  environmentSection,
  testingSection,
  cicdSection,
  toolingSection,
  integrationsSection,
  aiSection,
] as const;

export type { Difficulty, Question, Section, Topic } from './types.js';
export { DIFFICULTY_COEFFICIENTS } from './types.js';
