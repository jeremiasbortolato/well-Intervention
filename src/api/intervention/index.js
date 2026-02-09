/**
 * Intervention API Module
 * 
 * Main entry point for all intervention-related API functions.
 * This module exports functions organized by their purpose:
 * - Fetchers: Functions that retrieve data from APIs
 * - Calculators: Functions that perform calculations on data
 * - Comments: Functions for managing comments and memos
 * - Constants: Shared constants and configurations
 * - Utils: Utility functions
 */

// Utils
export { 
  unwrapCorvaResponse, 
  extractResults, 
  toDate, 
  toUnixSeconds 
} from './utils';

// Constants
export { 
  TRIPPING_CODE_GROUPS, 
  TRIPPING_CODE_TO_GROUP, 
  DVA_APP_KEY 
} from './constants';

// Event Fetchers
export { 
  fetchInterventionUnitEvents, 
  fetchNptEvents,
  getFailureIdentificationData 
} from './fetchers/events';

// Timelog Fetchers
export { 
  fetchTimelogData, 
  fetchWellPlanData, 
  fetchWellPlanStepsData, 
  fetchPlanProductionParams,
  fetchFinalReportPressureTests 
} from './fetchers/timelog';

// Goals Fetchers
export { 
  fetchInterventionTypeGoals, 
  fetchTrippingSpeedGoals, 
  getInterventionType 
} from './fetchers/goals';

// Cost Fetchers
export { 
  fetchCostReferences 
} from './fetchers/costs';

// Monitoring Fetchers
export { 
  getWindStatusData, 
  getTorqueConnectionsData 
} from './fetchers/monitoring';

// NPT Calculators
export { 
  getNPTGestionableNoGestionable, 
  getNPTByConsequence 
} from './calculators/npt';

// Deviation Calculators
export { 
  getDesvioOperativoTotal 
} from './calculators/deviations';

// Cost Calculators
export { 
  getNoCalidadCosts 
} from './calculators/costs';

// Lost Time Calculators
export { 
  getTNPByOpSubcode, 
  getOperationalLostTime 
} from './calculators/lostTime';

// Performance Calculators
export { 
  getPerformanceComparisonData 
} from './calculators/performance';

// Comments
export { 
  getTraceComments, 
  getWellComments 
} from './comments';

