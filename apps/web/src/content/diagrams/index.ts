import { catscript } from './catscript';
import { citywatch } from './citywatch';
import { cvStudio } from './cv-studio';
import { edgeInference } from './edge-inference';
import { faceRecognition } from './face-recognition';
import { guardianai } from './guardianai';
import { procwatch } from './procwatch';
import { storyGenerator } from './story-generator';
import { streamingPipeline } from './streaming-pipeline';
import { testpilot } from './testpilot';
import type { Diagram } from './types';

export type { Diagram, DiagramGroup, DiagramLink, DiagramStation, StationKind } from './types';

/** Each project's figure, by project id. */
export const diagrams: Record<string, Diagram> = {
  testpilot,
  citywatch,
  'cv-studio': cvStudio,
  guardianai,
  catscript,
  procwatch,
  'streaming-pipeline': streamingPipeline,
  'face-recognition': faceRecognition,
  'edge-inference': edgeInference,
  'story-generator': storyGenerator,
};
