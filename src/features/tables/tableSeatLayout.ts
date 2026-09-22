export interface SeatPosition {
  seat: number
  className: string
}

export const seatPositions: SeatPosition[] = [
  { seat: 1, className: 'seat-position-1' },
  { seat: 2, className: 'seat-position-10' },
  { seat: 3, className: 'seat-position-9' },
  { seat: 4, className: 'seat-position-8' },
  { seat: 5, className: 'seat-position-7' },
  { seat: 6, className: 'seat-position-6' },
  { seat: 7, className: 'seat-position-5' },
  { seat: 8, className: 'seat-position-4' },
  { seat: 9, className: 'seat-position-3' },
  { seat: 10, className: 'seat-position-2' },
]

export function getPlayerInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}