import type { StationKind } from '../../content/diagrams/types';
import type { StationBuilder } from '../scene/types';
import { cabinet } from './cabinet';
import { display } from './display';
import { gate } from './gate';
import { hopper } from './hopper';
import { press } from './press';
import { pusher } from './pusher';
import { queue } from './queue';
import { scanner } from './scanner';
import { tray } from './tray';

/** The machine that stands for each kind of step. */
export const builders: Record<StationKind, StationBuilder> = {
  hopper,
  press,
  cabinet,
  gate,
  scanner,
  pusher,
  queue,
  display,
  tray,
};
