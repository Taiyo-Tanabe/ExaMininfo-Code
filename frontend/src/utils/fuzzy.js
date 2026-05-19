// Romaji to hiragana conversion table
const ROMAJI_MAP = [
  ['chi','ち'],['tsu','つ'],['shi','し'],['tchi','っち'],
  ['tte','って'],['kka','っか'],['kki','っき'],['kku','っく'],['kke','っけ'],['kko','っこ'],
  ['ssa','っさ'],['ssi','っし'],['ssu','っす'],['sse','っせ'],['sso','っそ'],
  ['tta','った'],['ttu','っつ'],['tte','って'],['tto','っと'],
  ['hha','っは'],['nna','っな'],
  ['sha','しゃ'],['shi','し'],['shu','しゅ'],['she','しぇ'],['sho','しょ'],
  ['cha','ちゃ'],['chu','ちゅ'],['che','ちぇ'],['cho','ちょ'],
  ['tya','ちゃ'],['tyi','ち'],['tyu','ちゅ'],['tye','ちぇ'],['tyo','ちょ'],
  ['nya','にゃ'],['nyi','に'],['nyu','にゅ'],['nye','にぇ'],['nyo','にょ'],
  ['mya','みゃ'],['myi','み'],['myu','みゅ'],['mye','みぇ'],['myo','みょ'],
  ['rya','りゃ'],['ryi','り'],['ryu','りゅ'],['rye','りぇ'],['ryo','りょ'],
  ['hya','ひゃ'],['hyi','ひ'],['hyu','ひゅ'],['hye','ひぇ'],['hyo','ひょ'],
  ['kya','きゃ'],['kyi','き'],['kyu','きゅ'],['kye','きぇ'],['kyo','きょ'],
  ['gya','ぎゃ'],['gyi','ぎ'],['gyu','ぎゅ'],['gye','ぎぇ'],['gyo','ぎょ'],
  ['ja','じゃ'],['ji','じ'],['ju','じゅ'],['je','じぇ'],['jo','じょ'],
  ['dya','ぢゃ'],['dyi','ぢ'],['dyu','ぢゅ'],['dye','ぢぇ'],['dyo','ぢょ'],
  ['bya','びゃ'],['byi','び'],['byu','びゅ'],['bye','びぇ'],['byo','びょ'],
  ['pya','ぴゃ'],['pyi','ぴ'],['pyu','ぴゅ'],['pye','ぴぇ'],['pyo','ぴょ'],
  ['fa','ふぁ'],['fi','ふぃ'],['fu','ふ'],['fe','ふぇ'],['fo','ふぉ'],
  ['va','ゔぁ'],['vi','ゔぃ'],['vu','ゔ'],['ve','ゔぇ'],['vo','ゔぉ'],
  ['tsa','つぁ'],['tsi','つぃ'],['tse','つぇ'],['tso','つぉ'],
  ['ka','か'],['ki','き'],['ku','く'],['ke','け'],['ko','こ'],
  ['ga','が'],['gi','ぎ'],['gu','ぐ'],['ge','げ'],['go','ご'],
  ['sa','さ'],['si','し'],['su','す'],['se','せ'],['so','そ'],
  ['za','ざ'],['zi','じ'],['zu','ず'],['ze','ぜ'],['zo','ぞ'],
  ['ta','た'],['ti','ち'],['tu','つ'],['te','て'],['to','と'],
  ['da','だ'],['di','ぢ'],['du','づ'],['de','で'],['do','ど'],
  ['na','な'],['ni','に'],['nu','ぬ'],['ne','ね'],['no','の'],
  ['ha','は'],['hi','ひ'],['hu','ふ'],['he','へ'],['ho','ほ'],
  ['ba','ば'],['bi','び'],['bu','ぶ'],['be','べ'],['bo','ぼ'],
  ['pa','ぱ'],['pi','ぴ'],['pu','ぷ'],['pe','ぺ'],['po','ぽ'],
  ['ma','ま'],['mi','み'],['mu','む'],['me','め'],['mo','も'],
  ['ya','や'],['yu','ゆ'],['yo','よ'],
  ['ra','ら'],['ri','り'],['ru','る'],['re','れ'],['ro','ろ'],
  ['wa','わ'],['wi','ゐ'],['we','ゑ'],['wo','を'],
  ['a','あ'],['i','い'],['u','う'],['e','え'],['o','お'],
  ['n','ん'],
]

function romajiToHiragana(str) {
  let result = str.toLowerCase()
  // Sort by length desc to match longer patterns first
  const sorted = [...ROMAJI_MAP].sort((a, b) => b[0].length - a[0].length)
  for (const [roma, hira] of sorted) {
    result = result.split(roma).join(hira)
  }
  return result
}

// Katakana → Hiragana
function katakanaToHiragana(str) {
  return str.replace(/[ァ-ヶ]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  )
}

// Normalize: lowercase, katakana→hiragana
function normalize(str) {
  return katakanaToHiragana(str).toLowerCase()
}

// Try to interpret query as hiragana (via romaji conversion too)
function expandQuery(query) {
  const q = query.trim()
  const normalized = normalize(q)
  const fromRomaji = romajiToHiragana(q)
  const variants = new Set([q, normalized, fromRomaji, normalize(fromRomaji)])
  return [...variants].filter(Boolean)
}

/**
 * Fuzzy character-subsequence match.
 * Returns match score (higher = better) or -1 if no match.
 * Also fills `indices` array with matched character positions in `text`.
 */
function fuzzyMatch(text, query, indices) {
  if (!query) return 0
  let ti = 0, qi = 0, score = 0, lastMatch = -1
  while (ti < text.length && qi < query.length) {
    if (text[ti] === query[qi]) {
      indices.push(ti)
      // Consecutive matches bonus
      score += (lastMatch === ti - 1) ? 10 : 1
      lastMatch = ti
      qi++
    }
    ti++
  }
  if (qi < query.length) return -1
  // Prefer matches that start early
  score -= indices[0] * 0.1
  return score
}

/**
 * Build an HTML string from `text` with matched `indices` wrapped in <mark>.
 */
function buildHighlighted(text, indices) {
  const set = new Set(indices)
  let html = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    html += set.has(i) ? `<mark>${ch}</mark>` : ch
  }
  return html
}

/**
 * normalizeQuery — expand a user query into multiple search variants.
 * Returns the best single normalized form for sending to the backend.
 * Converts romaji → hiragana so "tokyo" finds "東京" if backend indexes readings.
 * At minimum returns the katakana→hiragana normalized version for consistency.
 */
export function normalizeQuery(query) {
  const q = query.trim()
  if (!q) return q
  return romajiToHiragana(katakanaToHiragana(q).toLowerCase())
}

/**
 * fuzzyFilter(items, query, getText)
 * items    — array of any objects
 * query    — user input string
 * getText  — (item) => string  — extracts the searchable text from an item
 *
 * Returns [{ item, highlighted, score }, ...] sorted by score desc.
 * highlighted is an HTML string with matched chars in <mark> tags.
 */
export function fuzzyFilter(items, query, getText) {
  if (!query || !query.trim()) return []

  const variants = expandQuery(query)
  const normQuery = normalize(query.trim())

  const results = []
  for (const item of items) {
    const rawText = getText(item)
    const normalText = normalize(rawText)

    let bestScore = -1
    let bestIndices = []

    for (const variant of variants) {
      const indices = []
      const score = fuzzyMatch(normalText, normalize(variant), indices)
      if (score > bestScore) {
        bestScore = score
        bestIndices = indices
      }
    }

    if (bestScore >= 0) {
      // 完全一致・前方一致・部分一致に大きなボーナスを付けて優先表示
      if (normalText === normQuery)                    bestScore += 1000 // 完全一致
      else if (normalText.startsWith(normQuery))       bestScore += 500  // 前方一致
      else if (normalText.includes(normQuery))         bestScore += 200  // 部分一致（連続）

      results.push({
        item,
        highlighted: buildHighlighted(rawText, bestIndices),
        score: bestScore,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}
