import { getBuiltInRatings } from 'web-codegen-scorer';

/** @type {import('web-codegen-scorer').EnvironmentConfig} */
export default {
  displayName: 'Zeffyr Music — Angular 22',
  id: 'zeffyr-music-angular',
  clientSideFramework: 'angular',
  packageManager: 'npm',

  generationSystemPrompt: './system-prompt.md',
  repairSystemPrompt: './repair-prompt.md',

  executablePrompts: ['./prompts/**/*.md'],

  buildCommand: 'npm run build',

  ratings: getBuiltInRatings(),
};
