import { useEffect, useMemo, useRef, useState } from 'react'
import { registerVisit } from './visitorStats'

type Language = 'english' | 'spanish'
type SpeechRecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> }
type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

const phrases: Record<string, string> = {
  'good morning': 'buenos días',
  'good afternoon': 'buenas tardes',
  'good evening': 'buenas noches',
  'how are you': '¿cómo estás?',
  'how are you doing': '¿cómo te va?',
  'what is your name': '¿cómo te llamas?',
  'nice to meet you': 'encantado de conocerte',
  'see you soon': 'hasta pronto',
  'see you later': 'hasta luego',
  'thank you very much': 'muchas gracias',
  'you are welcome': 'de nada',
  'i love you': 'te quiero',
  'have a nice day': 'que tengas un buen día',
  'where is the bathroom': '¿dónde está el baño?',
  'i would like a coffee': 'me gustaría un café',
  'i would like a coffee please': 'me gustaría un café, por favor',
  'good morning how are you': 'buenos días, ¿cómo estás?',
}

const words: Record<string, string> = {
  i: 'yo', you: 'tú', he: 'él', she: 'ella', we: 'nosotros', they: 'ellos',
  hello: 'hola', hi: 'hola', goodbye: 'adiós', please: 'por favor', thanks: 'gracias',
  thank: 'agradecer', yes: 'sí', no: 'no', my: 'mi', your: 'tu', name: 'nombre',
  is: 'es', are: 'son', am: 'soy', the: 'el', a: 'un', an: 'un', and: 'y', or: 'o',
  to: 'a', from: 'de', in: 'en', on: 'sobre', with: 'con', for: 'para', of: 'de',
  this: 'esto', that: 'eso', today: 'hoy', tomorrow: 'mañana', yesterday: 'ayer',
  morning: 'mañana', afternoon: 'tarde', evening: 'noche', night: 'noche', day: 'día',
  friend: 'amigo', family: 'familia', home: 'casa', work: 'trabajo', school: 'escuela',
  food: 'comida', water: 'agua', coffee: 'café', time: 'tiempo', help: 'ayuda',
  want: 'quiero', need: 'necesito', like: 'gustar', love: 'amar', have: 'tener',
  can: 'puedo', go: 'ir', come: 'venir', speak: 'hablar', understand: 'entender',
  learn: 'aprender', live: 'vivir', make: 'hacer', know: 'saber', good: 'bueno',
  bad: 'malo', big: 'grande', small: 'pequeño', happy: 'feliz', beautiful: 'hermoso',
  new: 'nuevo', much: 'mucho', more: 'más', here: 'aquí', there: 'allí', where: 'dónde',
  what: 'qué', when: 'cuándo', why: 'por qué', how: 'cómo',
}

const reversePhrases: Record<string, string> = Object.fromEntries(
  Object.entries(phrases).map(([english, spanish]) => [normalizeText(spanish), english]),
)
reversePhrases[normalizeText('Hola, cómo estás')] = 'hello, how are you?'
reversePhrases[normalizeText('Muy bien')] = 'very well'
reversePhrases['muay bian'] = 'very well'
reversePhrases[normalizeText('Se me antoja una cerveza')] = 'I feel like a beer'
reversePhrases[normalizeText('Vamos por una cerveza')] = "Let's go for a beer"

const spanishWords: Record<string, string> = {
  yo: 'I', tú: 'you', él: 'he', ella: 'she', nosotros: 'we', ellos: 'they',
  hola: 'hello', adiós: 'goodbye', por: 'for', favor: 'please', gracias: 'thanks',
  sí: 'yes', no: 'no', mi: 'my', tu: 'your', nombre: 'name', es: 'is', son: 'are',
  soy: 'am', el: 'the', la: 'the', un: 'a', una: 'a', y: 'and', o: 'or', a: 'to',
  de: 'of', en: 'in', sobre: 'on', con: 'with', para: 'for', esto: 'this', eso: 'that',
  hoy: 'today', mañana: 'tomorrow', ayer: 'yesterday', buenos: 'good', buenas: 'good',
  días: 'morning', tardes: 'afternoons', noches: 'nights', tarde: 'afternoon', noche: 'night',
  día: 'day', amigo: 'friend', amiga: 'friend', familia: 'family', casa: 'home',
  trabajo: 'work', escuela: 'school', comida: 'food', agua: 'water', café: 'coffee', cerveza: 'beer', vamos: "let's go",
  tiempo: 'time', ayuda: 'help', quiero: 'want', necesito: 'need', gustar: 'like',
  amar: 'love', tener: 'have', puedo: 'can', ir: 'go', venir: 'come', hablar: 'speak',
  entender: 'understand', aprender: 'learn', vivir: 'live', hacer: 'make', saber: 'know',
  estás: 'are you', muy: 'very', bien: 'well', bueno: 'good', malo: 'bad', grande: 'big', pequeño: 'small', feliz: 'happy',
  hermoso: 'beautiful', nuevo: 'new', mucho: 'much', más: 'more', aquí: 'here', allí: 'there',
  dónde: 'where', qué: 'what', cuándo: 'when', cómo: 'how', como: 'how', porqué: 'why',
  estas: 'are you',
}

const examples = [
  'Good morning, how are you?',
  'Good afternoon.',
  'Good evening.',
  'How are you doing?',
  'What is your name?',
  'I would like a coffee, please.',
  'Where is the bathroom?',
  'Nice to meet you.',
  'Thank you very much.',
  'You are welcome.',
  'I love you.',
  'Have a nice day.',
  'See you soon.',
  'See you later.',
]

const spanishSpeechCorrections: Record<string, string> = {
  muivian: 'Muy bien',
  muybian: 'Muy bien',
  mubien: 'Muy bien',
  grasias: 'Gracias',
  graciass: 'Gracias',
  buenosdias: 'Buenos días',
  buenastardes: 'Buenas tardes',
  buenasnoches: 'Buenas noches',
}
const spanishIndicatorWords = new Set([
  'adios', 'agua', 'amigo', 'amiga', 'aqui', 'bien', 'buenas', 'buenos', 'cafe', 'casa',
  'comida', 'como', 'donde', 'estas', 'familia', 'gracias', 'hablar', 'hola', 'hoy',
  'mañana', 'manana', 'nombre', 'necesito', 'noches', 'quiero', 'tardes', 'trabajo',
  'escuela', 'favor', 'por', 'puedo', 'comprar', 'días', 'dias', 'qué', 'que', 'muy', 'bien', 'muay', 'bian',
])

function normalizeText(value: string) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9']+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function stripAccents(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function detectLanguage(value: string): Language {
  const tokens = normalizeText(value).match(/[a-z]+/g) ?? []
  const spanishScore = tokens.reduce((score, token) => score + (spanishIndicatorWords.has(token) ? 1 : 0), 0)
  const hasSpanishMarker = /[¿¡áéíóúüñ]/i.test(value)
  return spanishScore > 0 || hasSpanishMarker ? 'spanish' : 'english'
}

function translateText(value: string, sourceLanguage: Language) {
  const normalized = normalizeText(value)
  if (!normalized) return ''
  const dictionary = sourceLanguage === 'english' ? words : spanishWords
  const phraseDictionary = sourceLanguage === 'english' ? phrases : reversePhrases
  const phraseMatch = Object.entries(phraseDictionary)
    .map(([phrase, translation]) => [normalizeText(phrase), translation] as const)
    .sort(([first], [second]) => second.length - first.length)
    .find(([phrase]) => normalized === phrase || normalized.startsWith(`${phrase} `))
  if (phraseMatch) {
    if (normalized === phraseMatch[0]) return capitalize(phraseMatch[1])
    const phraseWordCount = phraseMatch[0].split(' ').length
    const wordPattern = /[A-Za-zÀ-ÿ]+(?:'[A-Za-zÀ-ÿ]+)?/g
    let wordMatch: RegExpExecArray | null = null
    for (let index = 0; index < phraseWordCount; index += 1) wordMatch = wordPattern.exec(value)
    const suffix = wordMatch ? value.slice(wordMatch.index + wordMatch[0].length) : ''
    return `${capitalize(phraseMatch[1])}${suffix}`
  }

  return value.replace(/[A-Za-zÀ-ÿ]+(?:'[A-Za-zÀ-ÿ]+)?/g, (token) => {
    const normalizedToken = normalizeText(token)
    const translation = dictionary[token.toLowerCase()] ?? dictionary[normalizedToken]
    return translation ? matchCase(translation, token) : token
  })
}

async function translateOnline(value: string, sourceLanguage: Language, signal: AbortSignal) {
  const languagePair = sourceLanguage === 'english' ? 'en|es' : 'es|en'
  const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(value)}&langpair=${languagePair}`, { signal })
  if (!response.ok) throw new Error('Online translation unavailable')
  const data = await response.json() as { responseData?: { translatedText?: string } }
  return data.responseData?.translatedText?.trim() ?? ''
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function matchCase(value: string, source: string) {
  return source[0] === source[0].toUpperCase() ? capitalize(value) : value
}

function App() {
  const [source, setSource] = useState('')
  const [translated, setTranslated] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [visitorStats, setVisitorStats] = useState({ count: 0, shared: false })
  const [exampleStart, setExampleStart] = useState(0)
  const recognitionRef = useRef<SpeechRecognitionInstance[]>([])
  const sourceLanguage = useMemo(() => detectLanguage(source), [source])
  const targetLanguage: Language = sourceLanguage === 'english' ? 'spanish' : 'english'

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      const localTranslation = translateText(source, sourceLanguage)
      setTranslated(localTranslation)

      if (source.trim().length < 4) return
      translateOnline(source, sourceLanguage, controller.signal)
        .then((onlineTranslation) => {
          if (onlineTranslation) setTranslated(onlineTranslation)
        })
        .catch(() => undefined)
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [source, sourceLanguage])

  useEffect(() => {
    registerVisit().then(setVisitorStats)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExampleStart((current) => (current + 3) % examples.length)
    }, 3500)
    return () => window.clearInterval(timer)
  }, [])

  const sourceCount = source.length
  const translationReady = useMemo(() => Boolean(source.trim()), [source])

  const copyTranslation = async () => {
    if (!translated) return
    await navigator.clipboard?.writeText(translated)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const speakTranslation = () => {
    if (!translated || !('speechSynthesis' in window)) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(translated)
    utterance.lang = targetLanguage === 'spanish' ? 'es-ES' : 'en-US'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const toggleVoiceInput = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition

    if (!Recognition) {
      setVoiceError('Voice input is not supported in this browser.')
      return
    }

    if (isListening) {
      recognitionRef.current.forEach((recognition) => recognition.abort())
      recognitionRef.current = []
      setIsListening(false)
      return
    }

    let settled = false
    let activeSessions = 2
    const recognitions = (['en-US', 'es-ES'] as const).map((language) => {
      const recognition = new Recognition()
      recognition.lang = language
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onresult = (event) => {
        if (settled) return
        const rawTranscript = event.results[0]?.[0]?.transcript.trim() ?? ''
        const correctedTranscript = spanishSpeechCorrections[normalizeText(rawTranscript).replace(/ /g, '')] ?? rawTranscript
        if (!correctedTranscript) return
        settled = true
        recognitions.forEach((activeRecognition) => activeRecognition.abort())
        recognitionRef.current = []
        setIsListening(false)
        setSource((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${correctedTranscript}`)
      }
      recognition.onend = () => {
        activeSessions -= 1
        if (activeSessions === 0 && !settled) setIsListening(false)
      }
      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          settled = true
          setIsListening(false)
          setVoiceError(event.error === 'not-allowed'
            ? 'Microphone permission was denied. Allow microphone access for this site, then try again.'
            : 'No microphone was found. Connect a microphone, then try again.')
        }
      }
      return recognition
    })
    recognitionRef.current = recognitions
    setVoiceError('')
    setIsListening(true)
    recognitions.forEach((recognition) => recognition.start())
  }

  useEffect(() => () => recognitionRef.current.forEach((recognition) => recognition.abort()), [])

  const swapText = () => {
    if (!translated) return
    setSource(translated)
    setTranslated(source)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="LinguaFlow home">
          <span className="brand-mark">L</span>
          <span>Lingua<span>Flow</span></span>
        </a>
        <div className="topbar-status"><span>Created by Rick Saha</span><span className="status-divider" /><span className="visitor-count">{visitorStats.shared ? 'Visitors' : 'Local visits'}: {visitorStats.count || '...'}</span><span className="status-divider" /><span className="status-dot" /> Live translation</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">English ↔ Spanish</p>
          <h1>Find the words<br /><em>that connect us.</em></h1>
          <p className="hero-description">Write naturally in English or Spanish. The translation direction is detected as you type, with no waiting and no complicated setup.</p>
        </div>
        <div className="hero-note"><span className="note-line" />Powered by language<br />and a little intuition.</div>
      </section>

      <section className="workspace" aria-label="Translation workspace">
        <div className="language-row">
          <div className="language-pill"><span className="flag">{sourceLanguage === 'english' ? '🇬🇧' : '🇪🇸'}</span><span>{sourceLanguage === 'english' ? 'English' : 'Spanish'}</span><span className="language-label">Auto-detect</span></div>
          <button className="swap-button" onClick={swapText} aria-label="Swap languages and text" title="Swap text">
            <span>↔</span>
          </button>
          <div className="language-pill destination"><span className="flag">{targetLanguage === 'english' ? '🇬🇧' : '🇪🇸'}</span><span>{targetLanguage === 'english' ? 'English' : 'Spanish'}</span></div>
        </div>

        <div className="translation-grid">
          <div className="text-panel source-panel">
            <label htmlFor="source-text">Your words</label>
            <textarea id="source-text" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Start typing in English or Spanish..." maxLength={5000} autoFocus />
            <div className="panel-footer"><span>{sourceCount.toLocaleString()} / 5,000</span><div className="source-actions"><button className={`voice-button ${isListening ? 'listening' : ''}`} onClick={toggleVoiceInput} aria-label={isListening ? 'Stop automatic voice input' : 'Start automatic voice input'} title={isListening ? 'Stop voice input' : 'Auto-detect English or Spanish speech'}>{isListening ? '■' : '🎙'}</button><button className="clear-button" onClick={() => setSource('')} disabled={!source}>Clear</button></div></div>
            {voiceError && <div className="voice-error" role="status">{voiceError}</div>}
          </div>
          <div className="text-panel result-panel">
            <div className="result-heading"><label htmlFor="result-text">Your translation</label><span className="live-label"><span className="pulse-dot" /> Live</span></div>
            <div id="result-text" className={`result-text ${translationReady ? 'has-result' : ''}`} aria-live="polite">{translated || 'Your translation will appear here...'}</div>
            <div className="panel-footer result-actions"><span className="quality-label">{translationReady ? 'Ready in real time' : 'Waiting for your words'}</span><div className="action-buttons"><button onClick={speakTranslation} disabled={!translated} aria-label={isSpeaking ? 'Stop speaking' : 'Listen to translation'} title={isSpeaking ? 'Stop speaking' : 'Listen'}><span>{isSpeaking ? '■' : '◖'}</span></button><button onClick={copyTranslation} disabled={!translated} aria-label="Copy translation" title="Copy">{copied ? '✓' : '▣'}</button></div></div>
          </div>
        </div>

        <div className="examples"><span className="examples-label">Try a phrase</span>{[0, 1, 2, 3, 4, 5].map((offset) => { const example = examples[(exampleStart + offset) % examples.length]; return <button key={example} onClick={() => setSource(example)}>{example}</button> })}</div>
      </section>

      <footer className="footer"><span>Made for conversations that matter.</span><span>Local translation mode <span className="footer-dot" /></span></footer>
    </main>
  )
}

export default App
