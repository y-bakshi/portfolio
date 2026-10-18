import {
  ComputerIcon,
  CpuIcon,
  DatabaseIcon,
  GitBranchIcon,
  InboxDownloadIcon,
  Layers01Icon,
  PackageIcon,
  ScanIcon,
  ShieldCheckIcon,
} from '@hugeicons/core-free-icons';
import type { StationKind } from '../../content/diagrams';

/** The icon that stands for each kind of step. */
export const kindIcon = {
  hopper: InboxDownloadIcon,
  press: CpuIcon,
  cabinet: DatabaseIcon,
  gate: ShieldCheckIcon,
  scanner: ScanIcon,
  pusher: GitBranchIcon,
  queue: Layers01Icon,
  display: ComputerIcon,
  tray: PackageIcon,
} satisfies Record<StationKind, unknown>;
