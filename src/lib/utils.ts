import type { BJJBelt } from '../types/api';

export const beltColors: Record<BJJBelt, string> = {
  White: '#FFFFFF',
  Blue: '#0066CC',
  Purple: '#660099',
  Brown: '#8B4513',
  Black: '#000000',
  Black1: '#1A1A1A',
  Black2: '#333333',
  Black3: '#4D4D4D',
  Black4: '#666666',
  Black5: '#808080',
  Black6: '#999999',
  RedAndBlack: '#CC0000',
  RedAndWhite: '#FF0000',
  Red: '#CC0000',
  Red10: '#990000'
};

export const beltOrder: BJJBelt[] = [
  'White',
  'Blue',
  'Purple',
  'Brown',
  'Black',
  'Black1',
  'Black2',
  'Black3',
  'Black4',
  'Black5',
  'Black6',
  'RedAndBlack',
  'RedAndWhite',
  'Red',
  'Red10'
];

export function getBeltLevel(belt: BJJBelt): number {
  return beltOrder.indexOf(belt);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function truncateAddress(address: string, length: number = 8): string {
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function getBeltDisplayName(belt: BJJBelt): string {
  if (belt.startsWith('Black') && belt !== 'Black') {
    return `Black ${belt.slice(5)}`;
  }
  if (belt === 'RedAndBlack') return 'Red & Black';
  if (belt === 'RedAndWhite') return 'Red & White';
  return belt;
}
