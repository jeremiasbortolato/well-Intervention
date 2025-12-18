export const DEFAULT_SETTINGS = {
  isExampleCheckboxChecked: false,
};

export const INTERVENTION_TYPE_PROVIDER = 'ypf';
export const INTERVENTION_TYPE_DATASET = 'intervention.type.goals';
export const INTERVENTION_COMPANY_ID = 375;

export const INTERVENTION_OPTIONS = [
  { label: 'Workover', value: 'workover' },
  { label: 'Fractura', value: 'fractura' },
  { label: 'Pulling', value: 'pulling' },
];

export const BASIC_INFO_ITEMS = [
  { label: 'Equipo', value: '12,486.7', unit: 'ft' },
  { label: 'Pozo', value: '142.5', unit: 'ft/hr' },
  { label: 'Fecha Inicio', value: '-', unit: '' },
  { label: 'Fecha Fin', value: '-', unit: '' },
  { label: 'Tipo de Intervención', value: '125.4', unit: 'hrs' },
  { label: 'Yacimiento', value: '125.4', unit: 'hrs' },
  { label: 'Área', value: '125.4', unit: 'hrs' },
  { label: 'Familia de Intervencion', value: '-', unit: '' },
];

export const PLANNED_VS_ACTUAL_METRICS = [
  { label: 'Well Planing Ultimo', value: '1' },
  { label: 'Tiempo Planificado', value: '25', unit: 'días' },
  { label: 'Tiempo Total Real', value: '28.5', unit: 'días' },
];

// Default NPT items (used while loading)
export const NPT_ITEMS = [
  { label: 'Gestionable', value: '-', unit: 'del NPT' },
  { label: 'No Gestionable', value: '-', unit: 'del NPT' },
  { label: 'NPT Total', value: '-', isChip: true },
];

// NPT consequence codes for classification
export const NPT_CONSECUENCIAS = [
  { consecuencia: 'EQ. PARADO POR COND. CLIMÁTICAS', tipo: 'No gestionable', codigo: 111 },
  { consecuencia: 'EQ. PARADO - CAMINO INTRANSITABLE', tipo: 'No gestionable', codigo: 112 },
  { consecuencia: 'EQ. PARADO - LOCACIÓN INACCESIBLE', tipo: 'No gestionable', codigo: 113 },
  { consecuencia: 'ESPERA LOCACIÓN - CONFLICTO COMUNIDADES', tipo: 'No gestionable', codigo: 114 },
  { consecuencia: 'ESPERA LUZ DIURNA', tipo: 'No gestionable', codigo: 115 },
  { consecuencia: 'ESPERA - RAZONES GREMIALES (PETROLEROS)', tipo: 'No gestionable', codigo: 116 },
  {
    consecuencia: 'ESPERA - RAZONES GREMIALES (OTROS GREMIOS)',
    tipo: 'No gestionable',
    codigo: 117,
  },
  { consecuencia: 'ESPERA CIA SERVICIOS BOMBAS BES', tipo: 'Gestionable', codigo: 101 },
  { consecuencia: 'ESPERA CIA SERVICIOS BOMBAS PCP', tipo: 'Gestionable', codigo: 102 },
  { consecuencia: 'ESPERA OTROS SERVICIOS', tipo: 'Gestionable', codigo: 103 },
  { consecuencia: 'ESPERA CIA SERVICIOS HERRAMIENTAS', tipo: 'Gestionable', codigo: 104 },
  { consecuencia: 'ESPERA CAMIÓN CARGAS LÍQUIDAS', tipo: 'Gestionable', codigo: 105 },
  { consecuencia: 'ESPERA EQUIP. HOT OIL - VAPOR', tipo: 'Gestionable', codigo: 106 },
  { consecuencia: 'ESPERA SERV. HIDROELEV. DE PERSONAS', tipo: 'Gestionable', codigo: 107 },
  { consecuencia: 'ESPERA - HERRAMIENTA DE FONDO (NO TBG/VAR)', tipo: 'Gestionable', codigo: 108 },
  { consecuencia: 'ESPERA - SERVICIOS DTM', tipo: 'Gestionable', codigo: 118 },
  { consecuencia: 'EQUIPO PARADO SIN PERSONAL', tipo: 'Gestionable', codigo: 119 },
  { consecuencia: 'EQUIPO PARADO ESPERA PERSONAL', tipo: 'Gestionable', codigo: 120 },
  { consecuencia: 'PARADO POR REPARACIONES', tipo: 'Gestionable', codigo: 124 },
  { consecuencia: 'PARADO - COND. DE SEGURIDAD', tipo: 'Gestionable', codigo: 125 },
  { consecuencia: 'ESPERA BOMBA DE PROFUNDIDAD', tipo: 'Gestionable', codigo: 126 },
  { consecuencia: 'INCIDENTE / ACCIDENTE PERSONAL', tipo: 'Gestionable', codigo: 127 },
  { consecuencia: 'ESPERA MATERIALES BOCA DE POZO', tipo: 'Gestionable', codigo: 129 },
  { consecuencia: 'ESPERA SERV. DE ENERGÍA P/CONSIGNA', tipo: 'Gestionable', codigo: 130 },
  { consecuencia: 'ESPERA TUBING / VARILLAS', tipo: 'Gestionable', codigo: 137 },
  { consecuencia: 'ESPERA VÁSTAGO DE BOMBEO', tipo: 'Gestionable', codigo: 138 },
  { consecuencia: 'ESPERA CAMIÓN VACÍO', tipo: 'Gestionable', codigo: 139 },
  { consecuencia: 'ESPERA CARGA/DESCARGA MATERIALES', tipo: 'Gestionable', codigo: 140 },
  { consecuencia: 'ESPERA LOCACIÓN - CAMBIO PROGRAMA', tipo: 'Gestionable', codigo: 142 },
  { consecuencia: 'ESPERA - CAMBIO PROGRAMA INTERVENCIÓN', tipo: 'Gestionable', codigo: 143 },
  { consecuencia: 'ESPERA - PERSONAL YPF P/PRUEBAS', tipo: 'Gestionable', codigo: 144 },
  { consecuencia: 'ESPERA - ÓRDENES DE LA SUPERVISIÓN', tipo: 'Gestionable', codigo: 145 },
  { consecuencia: 'ESPERA - EQUIPO A DISPOSICIÓN YPF', tipo: 'Gestionable', codigo: 146 },
  { consecuencia: 'INVESTIGACIÓN DE INCIDENTE / ACCIDENTE', tipo: 'Gestionable', codigo: 147 },
  { consecuencia: 'I.N.D. PLANIFICADA', tipo: 'Gestionable', codigo: 148 },
  { consecuencia: 'INSPECCIÓN SEGURIDAD SOLICITADA POR YPF', tipo: 'Gestionable', codigo: 149 },
  { consecuencia: 'ESPERA CIA SERVICIOS ESPECIALES', tipo: 'Gestionable', codigo: 150 },
  { consecuencia: 'ESPERA CARGA/DESCARGA LÍQUIDAS', tipo: 'Gestionable', codigo: 151 },
  { consecuencia: 'ESPERA BATEA/CONTENEDOR ECOLÓGICO', tipo: 'Gestionable', codigo: 152 },
  { consecuencia: 'ESPERA CIA SERVICIOS CABEZA ROTATIVA', tipo: 'Gestionable', codigo: 153 },
  { consecuencia: 'PARADO CAUSAS NO DEFINIDAS (Dato MTR)', tipo: 'Gestionable', codigo: 154 },
  { consecuencia: 'FALTA DE HERRAMIENTAS DE EQUIPO', tipo: 'Gestionable', codigo: 155 },
  { consecuencia: 'ESPERA CANASTOS/CABALLETES/BASTIDORES', tipo: 'Gestionable', codigo: 156 },
  { consecuencia: 'ESPERA - PROBLEMA DE PLANTA - POZO', tipo: 'Gestionable', codigo: 157 },
  { consecuencia: 'ESPERA - OPERAR EN PULLING/WO', tipo: 'Gestionable', codigo: 158 },
  { consecuencia: 'LIMPIEZA/SANITIZACIÓN DE TRAILERS/MÓVIL', tipo: 'Gestionable', codigo: 159 },
  { consecuencia: 'ESPERA PROGRAMA DE INTERVENCIÓN', tipo: 'Gestionable', codigo: 160 },
  { consecuencia: 'ESPERA SERVICIOS WL-SL', tipo: 'Gestionable', codigo: 171 },
  { consecuencia: 'ESPERA FIRMA PERMISO DE TRABAJO', tipo: 'Gestionable', codigo: 172 },
  { consecuencia: 'ESPERA RECORREDOR PARA MANIOBRAR POZO', tipo: 'Gestionable', codigo: 173 },
  { consecuencia: 'ESPERA - REQUERIMIENTO INGRESO PU', tipo: 'Gestionable', codigo: 176 },
  { consecuencia: 'ESPERA CUADRILLA TAREAS GENERALES', tipo: 'Gestionable', codigo: 178 },
  { consecuencia: 'ESPERA CÍA. TELEMETRÍA', tipo: 'Gestionable', codigo: 179 },
  { consecuencia: 'ESPERA CÍA. LUMINARIAS', tipo: 'Gestionable', codigo: 180 },
  { consecuencia: 'ESPERA CÍA. AGUAS GRISES', tipo: 'Gestionable', codigo: 181 },
  { consecuencia: 'ESPERA CÍA. SLICK LINE', tipo: 'Gestionable', codigo: 182 },
  { consecuencia: 'ESPERA CÍA. WIRE LINE', tipo: 'Gestionable', codigo: 183 },
  { consecuencia: 'ESPERA CÍA. ANCLAJES', tipo: 'Gestionable', codigo: 184 },
  { consecuencia: 'ESPERA CÍA. BOMBEO', tipo: 'Gestionable', codigo: 185 },
  { consecuencia: 'ESPERA CÍA. QUÍMICOS', tipo: 'Gestionable', codigo: 186 },
  { consecuencia: 'ESPERA COILED TUBING', tipo: 'Gestionable', codigo: 187 },
  { consecuencia: 'ESPERA CÍA. AGUA DENSIFICADA', tipo: 'Gestionable', codigo: 188 },
  { consecuencia: 'ESPERA CÍA. ANCLA/PACKER', tipo: 'Gestionable', codigo: 189 },
  { consecuencia: 'ESPERA CIA SERVICIOS CABEZALES', tipo: 'Gestionable', codigo: 190 },
  { consecuencia: 'ESPERA CÍA. PESCA', tipo: 'Gestionable', codigo: 191 },
  { consecuencia: 'ESPERA RECORREDOR PRODUCCIÓN', tipo: 'Gestionable', codigo: 192 },
  { consecuencia: 'ESPERA CÍA. HERRAMIENTAS-OTROS', tipo: 'Gestionable', codigo: 193 },
  { consecuencia: 'ESPERA CÍA. BES', tipo: 'Gestionable', codigo: 194 },
  { consecuencia: 'ESPERA CÍA. PCP', tipo: 'Gestionable', codigo: 195 },
  { consecuencia: 'ESPERA CÍA. GAS LIFT', tipo: 'Gestionable', codigo: 196 },
  { consecuencia: 'ESPERA CÍA. CARGAS LÍQUIDAS', tipo: 'Gestionable', codigo: 197 },
  { consecuencia: 'ESPERA CÍA. OTROS', tipo: 'Gestionable', codigo: 198 },
  { consecuencia: 'ESPERA ANCLA/PACKER', tipo: 'Gestionable', codigo: 199 },
  { consecuencia: 'ESPERA SEPARADOR DE GAS', tipo: 'Gestionable', codigo: 200 },
  { consecuencia: 'ESPERA ZAPATO', tipo: 'Gestionable', codigo: 201 },
  { consecuencia: 'ESPERA MATERIALES CABEZAL DE POZO', tipo: 'Gestionable', codigo: 202 },
  { consecuencia: 'ESPERA MATERIALES-OTROS', tipo: 'Gestionable', codigo: 203 },
  { consecuencia: 'ESPERA FIRMA HANDOVER', tipo: 'Gestionable', codigo: 204 },
  { consecuencia: 'ESPERA FINALIZACIÓN INTERVENCION ISQ', tipo: 'Gestionable', codigo: 205 },
];

export const OPERATING_TIMES = {
  categories: ['Tiempo Op', 'TNP', 'PE', 'DTM'],
  values: [20.5, 4.2, 2.8, 1],
  colors: ['#3BA7FF', '#FF9D3B', '#9F7AEA', '#F56565'],
};

export const LOST_TIME_DATA = [
  { name: 'Espera de Herramientas (24 hs)', value: 24 },
  { name: 'Problemas Mecánicos (18 hs)', value: 18 },
  { name: 'Condiciones Climáticas (15 hs)', value: 15 },
  { name: 'Falla de Equipamiento (12 hs)', value: 12 },
  { name: 'SP MPDE (2 hs)', value: 2 },
];

export const TOP_CAUSES_BLOCKS = [
  {
    label: 'Total Tiempo Perdido',
    value: 74,
    unit: 'hs',
    comment:
      'SACA INSTALACION DE VARILLA (CON CARBONATO) - NOTA: SE OBSERVA BOMBA CON BARRIL DAÑADO',
  },
  {
    label: 'Espera de Herramientas',
    value: 32.4,
    unit: '% del total',
    comment:
      'SACA INSTALACION DE VARILLA (CON CARBONATO) - NOTA: SE OBSERVA BOMBA CON BARRIL DAÑADO',
    color: '#FF4D4F',
  },
  {
    label: 'Problemas Mecánicos',
    value: 20.3,
    unit: '% del total',
    comment:
      'SACA INSTALACION DE VARILLA (CON CARBONATO) - NOTA: SE OBSERVA BOMBA CON BARRIL DAÑADO',
    color: '#FBBF24',
  },
  {
    label: 'Problemas Mecánicos',
    value: 16.2,
    unit: '% del total',
    comment:
      'SACA INSTALACION DE VARILLA (CON CARBONATO) - NOTA: SE OBSERVA BOMBA CON BARRIL DAÑADO',
    color: '#FBBF24',
  },
  {
    label: 'Falla de Equipamiento',
    value: 24.3,
    unit: '% del total',
    comment:
      'SACA INSTALACION DE VARILLA (CON CARBONATO) - NOTA: SE OBSERVA BOMBA CON BARRIL DAÑADO',
    color: '#3BA7FF',
  },
  {
    label: 'Otros',
    value: 6.8,
    unit: '% del total',
    comment:
      'SACA INSTALACION DE VARILLA (CON CARBONATO) - NOTA: SE OBSERVA BOMBA CON BARRIL DAÑADO',
    color: '#9CA3AF',
  },
];

export const OPERATIONAL_SUMMARY = {
  unscrews: 42,
  dragLevels: [
    { label: 'Bajo', state: 'neutral', active: false },
    { label: 'Medio', state: 'info', active: true },
    { label: 'Alto', state: 'neutral', active: false },
  ],
  tests: [
    { label: 'Prueba de Bomba', checked: true, statusText: 'Ok', state: 'success' },
    { label: 'Prueba de Hermeticidad', checked: true, statusText: 'Ok', state: 'success' },
    { label: 'Prueba de Bomba', checked: false, statusText: 'Ok', state: 'success' },
  ],
  costs: [
    { label: 'Costo Desvio Operativo:', value: '$ 2,400' },
    { label: 'Costo Desvio NPT Gestionable:', value: '$ 2,400' },
    { label: 'Costo Desvio Prod. Diferida:', value: '$ 2,400' },
    { label: 'Costo de No Calidad:', value: '$ 2,400' },
  ],
  totalCost: '$ 9,600',
};

export const PERFORMANCE_ROWS = [
  {
    category: 'Tubing',
    operation: 'Saca Simple',
    actual: 145,
    target: 140,
    difference: '+ 5 (3.6%)',
    differenceState: 'success',
  },
  {
    category: 'Tubing',
    operation: 'Saca Doble',
    actual: 285,
    target: 280,
    difference: '+ 5 (1.8%)',
    differenceState: 'success',
  },
  {
    category: 'Tubing',
    operation: 'Baja Simple',
    actual: 138,
    target: 150,
    difference: '- 12 (-0.8%)',
    differenceState: 'error',
  },
  {
    category: 'Tubing',
    operation: 'Baja Doble',
    actual: 295,
    target: 290,
    difference: '+ 5 (1.7%)',
    differenceState: 'success',
  },
  {
    category: 'Varillas',
    operation: 'Saca Simple',
    actual: 165,
    target: 160,
    difference: '+ 5 (3.1%)',
    differenceState: 'success',
  },
  {
    category: 'Varillas',
    operation: 'Saca Doble',
    actual: 310,
    target: 300,
    difference: '+ 10 (3.3%)',
    differenceState: 'success',
  },
  {
    category: 'Varillas',
    operation: 'Baja Simple',
    actual: 148,
    target: 155,
    difference: '- 7 (-4.5%)',
    differenceState: 'error',
  },
  {
    category: 'Varillas',
    operation: 'Baja Doble',
    actual: 315,
    target: 310,
    difference: '+ 5 (1.6%)',
    differenceState: 'success',
  },
];
