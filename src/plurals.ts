// ============================================================
// Odmiana polskich rzeczowników z liczbami.
//
// Reguły:
//   1          → forma pojedyncza (mianownik)
//   2, 3, 4    → forma mnoga (mianownik) — ALE NIE 12, 13, 14
//   5+         → forma dopełniacza l. mn.
//   12, 13, 14 → forma dopełniacza l. mn. (wyjątek)
// ============================================================

export function plural(
  count: number,
  singular: string,
  plural2_4: string,
  plural5plus: string,
): string {
  if (count === 1) return singular;

  const lastTwo = count % 100;
  if (lastTwo >= 12 && lastTwo <= 14) return plural5plus;

  const lastDigit = count % 10;
  if (lastDigit >= 2 && lastDigit <= 4) return plural2_4;

  return plural5plus;
}

// "zawodnik" – w potocznej polszczyźnie: 2+ = "zawodników"
export function pluralZawodnik(n: number): string {
  return n === 1 ? 'zawodnik' : 'zawodników';
}

export function pluralRaport(n: number): string {
  return plural(n, 'raport', 'raporty', 'raportów');
}

export function pluralKategoria(n: number): string {
  return plural(n, 'kategoria', 'kategorie', 'kategorii');
}

export function pluralPostep(n: number): string {
  return plural(n, 'postęp', 'postępy', 'postępów');
}

export function pluralWpis(n: number): string {
  return plural(n, 'wpis', 'wpisy', 'wpisów');
}
