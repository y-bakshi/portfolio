import type { Diagram } from './types';

/** Serverless face recognition: detection and recognition are separate functions with a queue between them. */
export const faceRecognition: Diagram = {
  summary: 'A flow chart. Faces are detected, passed through an SQS queue, and then recognized.',
  stations: [
    {
      id: 'detect',
      kind: 'scanner',
      label: 'Detect faces',
      sub: 'MTCNN detects the faces, in its own Lambda function.',
      col: 0,
      row: 0,
    },
    {
      id: 'sqs',
      kind: 'queue',
      label: 'SQS queue',
      sub: 'An SQS queue joins the two functions.',
      col: 1,
      row: 0,
    },
    {
      id: 'recognize',
      kind: 'cabinet',
      label: 'Recognize',
      sub: 'FaceNet recognizes them, in a separate Lambda function.',
      col: 2,
      row: 0,
    },
  ],
  links: [
    { from: 'detect', to: 'sqs' },
    { from: 'sqs', to: 'recognize' },
  ],
  routes: [['detect', 'sqs', 'recognize']],
};
