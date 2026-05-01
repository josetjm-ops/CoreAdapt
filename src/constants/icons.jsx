import React from 'react';
import { Activity, Dumbbell, Bike, Waves, Mountain, Moon } from 'lucide-react';

export const DISCIPLINE_ICONS = {
  'Running':      <Activity  size={24} strokeWidth={1.5} />,
  'Trail_Running':<Mountain  size={24} strokeWidth={1.5} />,
  'Ruta':         <Bike      size={24} strokeWidth={1.5} />,
  'MTB':          <Bike      size={24} strokeWidth={1.5} />,
  'Pesas':        <Dumbbell  size={24} strokeWidth={1.5} />,
  'Natacion':     <Waves     size={24} strokeWidth={1.5} />,
  'Descanso':     <Moon      size={24} strokeWidth={1.5} />,
};

export const DISCIPLINE_EMOJI = {
  running:  '🏃',
  trail:    '⛰️',
  ciclismo: '🚴',
  mtb:      '🚵',
  pesas:    '🏋️',
  natacion: '🏊',
};
