const durationPattern = /^(\d+)(ms|s|m|h|d)$/i;

const durationUnits: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

export const durationToMilliseconds = (value: string): number => {
  const normalized = value.trim().toLowerCase();
  const match = durationPattern.exec(normalized);

  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const [, amount, unit] = match;
  return Number(amount) * durationUnits[unit];
};

