export type GreetingMode = 'auto' | 'manha' | 'tarde' | 'noite';

export interface GreetingInfo {
  mode: GreetingMode;
  actualPeriod: 'manha' | 'tarde' | 'noite';
  greeting: string;        // "Bom dia" | "Boa tarde" | "Boa noite"
  greetingLower: string;   // "bom dia" | "boa tarde" | "boa noite"
  label: string;
  icon: string;
}

export function getActualPeriod(date: Date = new Date()): 'manha' | 'tarde' | 'noite' {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) {
    return 'manha';
  }
  if (hours >= 12 && hours < 18) {
    return 'tarde';
  }
  return 'noite';
}

export function getGreetingInfo(mode: GreetingMode = 'auto', date: Date = new Date()): GreetingInfo {
  const actualPeriod = getActualPeriod(date);
  const effectivePeriod = mode === 'auto' ? actualPeriod : mode;

  let greeting = 'Boa tarde';
  let greetingLower = 'boa tarde';
  let icon = '🌤️';
  let label = 'Tarde';

  if (effectivePeriod === 'manha') {
    greeting = 'Bom dia';
    greetingLower = 'bom dia';
    icon = '☀️';
    label = 'Manhã';
  } else if (effectivePeriod === 'tarde') {
    greeting = 'Boa tarde';
    greetingLower = 'boa tarde';
    icon = '🌤️';
    label = 'Tarde';
  } else {
    greeting = 'Boa noite';
    greetingLower = 'boa noite';
    icon = '🌙';
    label = 'Noite';
  }

  return {
    mode,
    actualPeriod,
    greeting,
    greetingLower,
    label,
    icon,
  };
}

/**
 * Transforms any template text to have the proper time-of-day greeting.
 * Replaces variations like "Boa tarde!", "Bom dia!", "bom dia/boa tarde", etc.
 */
export function applyGreetingToText(
  text: string,
  mode: GreetingMode = 'auto',
  date: Date = new Date()
): string {
  if (!text) return '';
  const info = getGreetingInfo(mode, date);
  const { greeting, greetingLower } = info;

  let updated = text;

  // Replace compound slash variations e.g. "bom dia/boa tarde", "Boa tarde/Bom dia"
  updated = updated.replace(/bom dia\/boa tarde/gi, greetingLower);
  updated = updated.replace(/boa tarde\/bom dia/gi, greetingLower);
  updated = updated.replace(/bom dia\/boa noite/gi, greetingLower);
  updated = updated.replace(/boa noite\/bom dia/gi, greetingLower);

  // Replace standard opening greetings: "Boa tarde!", "Bom dia!", "Boa noite!"
  // Notice the capitalization matching
  updated = updated.replace(/\bBoa tarde\b/g, greeting);
  updated = updated.replace(/\bBom dia\b/g, greeting);
  updated = updated.replace(/\bBoa noite\b/g, greeting);

  // Replace lowercase inside sentences if any
  updated = updated.replace(/\bboa tarde\b/g, greetingLower);
  updated = updated.replace(/\bbom dia\b/g, greetingLower);
  updated = updated.replace(/\bboa noite\b/g, greetingLower);

  // Replace explicit tags if user created custom templates with tags
  updated = updated.replace(/\{saudacao\}/gi, greeting);
  updated = updated.replace(/\[saudacao\]/gi, greeting);
  updated = updated.replace(/\{greeting\}/gi, greeting);

  return updated;
}
