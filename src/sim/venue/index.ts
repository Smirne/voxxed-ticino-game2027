export * from './types';
export { buildWalls, inPoly, polyArea } from './build';
export { GROUND } from './ground';
export { FIRST } from './first';

import { FIRST } from './first';
import { GROUND } from './ground';

export const FLOORS = { ground: GROUND, first: FIRST } as const;
