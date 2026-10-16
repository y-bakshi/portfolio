import type { Diagram } from './types';

/** Serverless face recognition: detection and recognition are separate functions with a queue between them. */
export const faceRecognition: Diagram = {
  summary:
    'A production line. A scanner detects faces, a queue holds the results, and a cabinet matches each face to a known one. The queue between them lets each stage scale on its own.',
  stations: [
    {
      id: 'detect',
      kind: 'scanner',
      label: 'Detect faces',
      sub: 'MTCNN finds the faces in an image, in its own Lambda function.',
      col: 0,
      row: 0,
    },
    {
      id: 'sqs',
      kind: 'queue',
      label: 'SQS queue',
      sub: 'Detected faces wait their turn.',
      col: 1,
      row: 0,
    },
    {
      id: 'recognize',
      kind: 'cabinet',
      label: 'Recognize',
      sub: 'FaceNet matches each face, in a second Lambda function.',
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
