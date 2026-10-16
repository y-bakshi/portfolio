import type { Diagram } from './types';

/** Edge inference: detection runs on the device, and only detected faces cross the network to the cloud. */
export const edgeInference: Diagram = {
  summary:
    'A flow chart. A camera frame is checked for faces on the edge device. Only the faces go on, through MQTT and SQS, to cloud recognition. Frames with no face never leave the device.',
  stations: [
    {
      id: 'frame',
      kind: 'hopper',
      label: 'Camera frame',
      sub: 'A camera frame arrives.',
      col: 0,
      row: 0,
    },
    {
      id: 'edge',
      kind: 'scanner',
      label: 'Detect on the edge device',
      sub: 'Face detection runs on an AWS IoT Greengrass edge device. Empty frames never leave it.',
      col: 1,
      row: 0,
    },
    {
      id: 'mqtt',
      kind: 'queue',
      label: 'MQTT and SQS',
      sub: 'Only the detected faces travel on, over MQTT and SQS.',
      col: 2,
      row: 0,
    },
    {
      id: 'cloud',
      kind: 'cabinet',
      label: 'Cloud recognition',
      sub: 'The faces are recognized in the cloud.',
      col: 3,
      row: 0,
    },
  ],
  links: [
    { from: 'frame', to: 'edge' },
    { from: 'edge', to: 'mqtt' },
    { from: 'mqtt', to: 'cloud' },
  ],
  groups: [
    { label: 'Edge device', members: ['edge'] },
    { label: 'Cloud', members: ['cloud'] },
  ],
  routes: [['frame', 'edge', 'mqtt', 'cloud']],
};
