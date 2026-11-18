import { normalizeString } from '@/src/lib/utils'
import { SQL, sql, SQLWrapper } from 'drizzle-orm'

/**
 * Accent- and case-insensitive search helpers for SQLite.
 *
 * SQLite has no `unaccent()` and its `lower()` only folds ASCII, so a plain
 * `LIKE '%acai%'` never matches "Açaí". We fold the column inside the query
 * with a chain of `replace()` calls (Portuguese accents, both cases) and
 * compare it with the term normalized in JS by `normalizeString`.
 *
 * `%term%` LIKE can't use an index anyway, so the extra replace() calls cost
 * only CPU per scanned row (a few ms for thousands of rows).
 */

const ACCENT_FOLDS: readonly [string, string][] = [
  ['á', 'a'], ['à', 'a'], ['â', 'a'], ['ã', 'a'], ['ä', 'a'],
  ['Á', 'a'], ['À', 'a'], ['Â', 'a'], ['Ã', 'a'], ['Ä', 'a'],
  ['é', 'e'], ['è', 'e'], ['ê', 'e'], ['ë', 'e'],
  ['É', 'e'], ['È', 'e'], ['Ê', 'e'], ['Ë', 'e'],
  ['í', 'i'], ['ì', 'i'], ['î', 'i'], ['ï', 'i'],
  ['Í', 'i'], ['Ì', 'i'], ['Î', 'i'], ['Ï', 'i'],
  ['ó', 'o'], ['ò', 'o'], ['ô', 'o'], ['õ', 'o'], ['ö', 'o'],
  ['Ó', 'o'], ['Ò', 'o'], ['Ô', 'o'], ['Õ', 'o'], ['Ö', 'o'],
  ['ú', 'u'], ['ù', 'u'], ['û', 'u'], ['ü', 'u'],
  ['Ú', 'u'], ['Ù', 'u'], ['Û', 'u'], ['Ü', 'u'],
  ['ç', 'c'], ['Ç', 'c'], ['ñ', 'n'], ['Ñ', 'n'],
] // prettier-ignore

/** `column` lower-cased and without accents, as an SQL expression. */
export function foldedSql(column: SQLWrapper): SQL {
  let expr: SQL = sql`lower(${column})`
  for (const [from, to] of ACCENT_FOLDS) {
    // Literals are fixed single characters without quotes: safe to inline.
    expr = sql`replace(${expr}, ${sql.raw(`'${from}'`)}, ${sql.raw(`'${to}'`)})`
  }
  return expr
}

/** Normalizes the user's term and escapes LIKE wildcards (`%`, `_`, `\`). */
export function toLikePattern(term: string): string | null {
  const normalized = normalizeString(term.trim())
  if (!normalized) return null
  return `%${normalized.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

/**
 * `column` contains `term`, ignoring accents and case.
 * Returns undefined for an empty term, so it can be pushed into `and(...)`.
 */
export function containsFolded(
  column: SQLWrapper,
  term: string | undefined | null
): SQL | undefined {
  const pattern = term ? toLikePattern(term) : null
  if (!pattern) return undefined
  return sql`${foldedSql(column)} LIKE ${pattern} ESCAPE '\\'`
}
