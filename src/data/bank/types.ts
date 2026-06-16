export type Difficulty = 'novice' | 'intermediate' | 'advanced' | 'expert';

export interface Question {
  readonly q: string;
  readonly level: Difficulty;
}

export interface Topic {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly tag: string;
  readonly questions: readonly Question[];
}

export interface Section {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly items: readonly Topic[];
}

export const DIFFICULTY_COEFFICIENTS: Record<Difficulty, number> = {
  novice: 1.0,
  intermediate: 1.25,
  advanced: 1.5,
  expert: 1.75,
} as const;
