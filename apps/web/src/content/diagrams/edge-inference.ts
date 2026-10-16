import type { Diagram } from './types';

/** Edge inference: detection runs on the device, and only detected faces cross the network to the cloud. */
export const edgeInference: Diagram = {
  summary:
    'A production line. A camera frame enters a hopper, a scanner on the edge device looks for faces, and only the faces ride on through a queue to the cloud cabinet that recognizes them. Frames with no face never leave the device.',
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
  routes: [['frame', 'edge', 'mqtt', 'cloud']],
};
