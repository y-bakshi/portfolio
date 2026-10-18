import { CORE_JS } from './script-core';
import { MAIN_JS } from './script-main';
import { TABS_JS } from './script-tabs';

/**
 * The owner page's script, kept as a string so the Worker can serve it, built from the parts that
 * each do one job: shared helpers, one renderer per tab, and the tabs and loading. It runs in its
 * own function, so none of its variables can collide with the window's.
 */
export const ADMIN_JS = `(function () {
'use strict';
${CORE_JS}
${TABS_JS}
${MAIN_JS}
})();
`;
