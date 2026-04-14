import { useState, useEffect, useRef } from 'react'

// ═══════════════════════════════════════════════
//  GLOBAL STYLES
// ═══════════════════════════════════════════════
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    background: #000000;
    color: #ffffff;
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  ::selection { background: #fff; color: #000; }
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: #000; }
  ::-webkit-scrollbar-thumb { background: #1e1e1e; }

  @keyframes tsFadeIn  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes tsSlowFade{ from { opacity:0; } to { opacity:1; } }
  @keyframes tsPulse   { 0%,100%{transform:scale(1);opacity:.7;} 50%{transform:scale(1.6);opacity:0;} }
  @keyframes tsSpin    { to { transform: rotate(360deg); } }

  .ts-fade  { animation: tsFadeIn   0.9s cubic-bezier(.4,0,.2,1) both; }
  .ts-slow  { animation: tsSlowFade 1.4s ease both; }

  /* Page */
  .ts-page { min-height:100vh; display:flex; flex-direction:column; background:#000; }
  .ts-header { padding:clamp(28px,4vw,52px) 24px; text-align:center; }
  .ts-logo { font-family:'Cinzel',serif; font-size:clamp(12px,1.4vw,15px); letter-spacing:.5em; color:#fff; }
  .ts-hero { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:clamp(40px,8vw,100px) 24px clamp(40px,6vw,80px); }
  .ts-rule-top { width:1px; height:clamp(40px,6vw,72px); background:linear-gradient(to bottom,transparent,#252525); margin-bottom:clamp(32px,5vw,56px); }
  .ts-rule-bot { width:1px; height:clamp(40px,6vw,72px); background:linear-gradient(to bottom,#252525,transparent); margin-top:clamp(32px,5vw,56px); }
  .ts-headline { font-family:'Cinzel',serif; font-size:clamp(24px,5vw,58px); font-weight:600; letter-spacing:.03em; line-height:1.15; max-width:840px; margin-bottom:22px; }
  .ts-subheadline { font-family:'DM Sans',sans-serif; font-size:clamp(13px,1.6vw,17px); font-weight:300; color:#888; max-width:480px; line-height:1.75; margin-bottom:clamp(36px,5vw,60px); }
  .ts-cta { display:inline-block; padding:14px 44px; border:1px solid #fff; background:transparent; color:#fff; font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; letter-spacing:.3em; text-transform:uppercase; cursor:pointer; transition:background .4s ease,color .4s ease; }
  .ts-cta:hover { background:#fff; color:#000; }
  .ts-footer { padding:clamp(20px,3vw,36px) 24px; text-align:center; }
  .ts-footer p { font-family:'DM Sans',sans-serif; font-size:9px; letter-spacing:.18em; color:#383838; }

  /* Video */
  .ts-video-section { width:100%; max-width:860px; padding-top:clamp(20px,4vw,60px); }
  .ts-video-label { font-family:'DM Sans',sans-serif; font-size:9px; letter-spacing:.4em; color:#2e2e2e; margin-bottom:16px; text-transform:uppercase; }
  .ts-video-wrap { position:relative; width:100%; aspect-ratio:16/9; background:#060606; border:1px solid #141414; overflow:hidden; }
  .ts-video-wrap video { width:100%; height:100%; object-fit:cover; display:block; }
  .ts-play-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; cursor:pointer; background:rgba(0,0,0,.2); transition:background .3s; }
  .ts-play-overlay:hover { background:transparent; }
  .ts-play-circle { width:72px; height:72px; border-radius:50%; border:1px solid rgba(255,255,255,.55); display:flex; align-items:center; justify-content:center; position:relative; transition:border-color .3s; }
  .ts-play-circle::before { content:''; position:absolute; inset:-1px; border-radius:50%; border:1px solid rgba(255,255,255,.12); animation:tsPulse 2.5s ease-out infinite; }
  .ts-play-overlay:hover .ts-play-circle { border-color:rgba(255,255,255,.9); }
  .ts-play-tri { width:0; height:0; border-top:10px solid transparent; border-bottom:10px solid transparent; border-left:18px solid #fff; margin-left:5px; }

  /* Overlay */
  .ts-overlay { position:fixed; inset:0; z-index:100; background:#111; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 24px 80px; transition:opacity .8s ease; overflow-y:auto; }
  .ts-overlay-top { position:absolute; top:0; left:0; right:0; display:flex; align-items:center; justify-content:center; padding:28px 24px; }
  .ts-overlay-logo { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.46em; color:#2a2a2a; }
  .ts-close { position:absolute; right:32px; top:50%; transform:translateY(-50%); background:none; border:none; color:#2e2e2e; font-size:18px; cursor:pointer; transition:color .3s; line-height:1; padding:4px; }
  .ts-close:hover { color:#fff; }

  /* Step */
  .ts-step { width:100%; max-width:560px; display:flex; flex-direction:column; align-items:flex-start; animation:tsFadeIn .7s cubic-bezier(.4,0,.2,1) both; }
  .ts-step-label { font-family:'Cinzel',serif; font-size:9px; letter-spacing:.38em; color:#3a3a3a; margin-bottom:28px; text-transform:uppercase; }
  .ts-step-prompt { font-family:'Cinzel',serif; font-size:clamp(16px,2.8vw,28px); letter-spacing:.04em; line-height:1.45; color:#fff; margin-bottom:32px; }
  .ts-step-prompt-sm { font-size:clamp(13px,1.9vw,20px); }
  .ts-disclaimer-text { font-family:'Cormorant Garamond',serif; font-style:italic; font-weight:300; font-size:clamp(16px,2.4vw,24px); color:#aaa; line-height:1.85; margin-bottom:44px; max-width:500px; }
  .ts-final-note { font-family:'Cormorant Garamond',serif; font-style:italic; font-weight:300; font-size:clamp(15px,2vw,20px); color:#666; line-height:1.85; margin-bottom:44px; max-width:500px; }

  /* Inputs */
  .ts-input, .ts-textarea {
    width:100%; background:transparent; border:none; border-bottom:1px solid #222;
    color:#fff; font-family:'DM Sans',sans-serif; font-size:20px; font-weight:300;
    padding:12px 0; outline:none; transition:border-color .3s; appearance:none; -webkit-appearance:none;
  }
  .ts-input::placeholder, .ts-textarea::placeholder { color:#2e2e2e; font-size:17px; }
  .ts-input:focus, .ts-textarea:focus { border-bottom-color:#555; }
  .ts-input.err, .ts-textarea.err { border-bottom-color:#8b2222 !important; }
  .ts-textarea { resize:none; min-height:120px; line-height:1.75; }

  /* Error */
  .ts-err { font-family:'DM Sans',sans-serif; font-size:10px; letter-spacing:.12em; color:#8b2222; margin-top:10px; min-height:16px; text-transform:uppercase; display:flex; align-items:center; gap:6px; opacity:0; transform:translateY(-4px); transition:opacity .25s,transform .25s; }
  .ts-err.show { opacity:1; transform:translateY(0); }
  .ts-err::before { content:''; width:4px; height:4px; border-radius:50%; background:#8b2222; flex-shrink:0; }

  /* Success inline */
  .ts-ok { font-family:'DM Sans',sans-serif; font-size:10px; letter-spacing:.12em; color:#2d6a2d; margin-top:10px; min-height:16px; text-transform:uppercase; display:flex; align-items:center; gap:6px; opacity:0; transform:translateY(-4px); transition:opacity .25s,transform .25s; }
  .ts-ok.show { opacity:1; transform:translateY(0); }
  .ts-ok::before { content:''; width:4px; height:4px; border-radius:50%; background:#2d6a2d; flex-shrink:0; }

  /* Phone row */
  .ts-phone-row { display:flex; gap:14px; align-items:flex-end; width:100%; }
  .ts-cc { width:96px; flex-shrink:0; background:transparent; border:none; border-bottom:1px solid #222; color:#555; font-family:'DM Sans',sans-serif; font-size:18px; font-weight:300; padding:12px 0; outline:none; appearance:none; -webkit-appearance:none; cursor:pointer; transition:border-color .3s,color .3s; }
  .ts-cc:focus { border-bottom-color:#555; color:#fff; }
  .ts-cc.err { border-bottom-color:#8b2222; }
  .ts-cc option { background:#111; color:#fff; }

  /* Net worth */
  .ts-nw-list { width:100%; display:flex; flex-direction:column; }
  .ts-nw-opt { width:100%; background:transparent; border:none; border-bottom:1px solid #181818; color:#484848; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:300; letter-spacing:.06em; padding:18px 0; text-align:left; cursor:pointer; transition:color .25s,border-bottom-color .25s,padding-left .25s; }
  .ts-nw-opt:hover { color:#999; padding-left:8px; }
  .ts-nw-opt.sel { color:#fff; border-bottom-color:#333; padding-left:16px; }

  /* Continue button */
  .ts-next { display:inline-flex; align-items:center; gap:12px; background:transparent; border:none; color:#484848; font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; letter-spacing:.22em; text-transform:uppercase; cursor:pointer; transition:color .3s; margin-top:36px; padding:0; }
  .ts-next:hover { color:#fff; }
  .ts-next:disabled { opacity:.3; cursor:not-allowed; }
  .ts-arrow { display:inline-block; width:32px; height:1px; background:currentColor; position:relative; transition:width .3s; }
  .ts-next:hover:not(:disabled) .ts-arrow { width:48px; }
  .ts-arrow::after { content:''; position:absolute; right:0; top:-3px; width:7px; height:7px; border-top:1px solid currentColor; border-right:1px solid currentColor; transform:rotate(45deg); }

  /* Submit */
  .ts-submit { padding:16px 52px; background:#fff; color:#000; border:none; font-family:'DM Sans',sans-serif; font-size:10px; font-weight:500; letter-spacing:.28em; text-transform:uppercase; cursor:pointer; transition:opacity .3s; }
  .ts-submit:hover { opacity:.82; }
  .ts-submit:disabled { opacity:.4; cursor:not-allowed; }

  /* OTP boxes */
  .ts-otp-row { display:flex; gap:10px; }
  .ts-otp-box {
    width:48px; height:56px; background:transparent;
    border:none; border-bottom:1px solid #333;
    color:#fff; font-family:'Cinzel',serif; font-size:22px; font-weight:400;
    text-align:center; outline:none; transition:border-color .3s; caret-color:transparent;
  }
  .ts-otp-box:focus { border-bottom-color:#888; }
  .ts-otp-box.err   { border-bottom-color:#8b2222; }
  .ts-otp-box.filled{ border-bottom-color:#444; }

  /* OTP send button (inline text link style) */
  .ts-otp-send {
    background:none; border:none; color:#555; cursor:pointer;
    font-family:'DM Sans',sans-serif; font-size:10px;
    letter-spacing:.18em; text-transform:uppercase; margin-top:28px;
    transition:color .3s; text-decoration:none; display:inline-block; padding:0;
  }
  .ts-otp-send:hover:not(:disabled) { color:#fff; }
  .ts-otp-send:disabled { opacity:.3; cursor:not-allowed; }

  /* Timer */
  .ts-timer { font-family:'DM Sans',sans-serif; font-size:10px; color:#333; margin-top:16px; letter-spacing:.1em; }

  /* Verified badge */
  .ts-verified { display:inline-flex; align-items:center; gap:8px; font-family:'DM Sans',sans-serif; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#2d6a2d; margin-top:14px; }
  .ts-verified-dot { width:6px; height:6px; border-radius:50%; background:#2d6a2d; }

  /* Spinner */
  .ts-spin { width:14px; height:14px; border-radius:50%; border:1.5px solid rgba(255,255,255,.2); border-top-color:#fff; animation:tsSpin .6s linear infinite; display:inline-block; margin-right:8px; vertical-align:middle; }

  /* Confirm */
  .ts-confirm { display:flex; flex-direction:column; align-items:center; width:100%; max-width:560px; animation:tsSlowFade 1.2s ease both; }
  .ts-confirm-line { width:1px; height:56px; background:#1e1e1e; margin:0 auto; }
  .ts-confirm-label { font-family:'Cinzel',serif; font-size:9px; letter-spacing:.44em; color:#2e2e2e; margin:28px 0; text-transform:uppercase; }
  .ts-confirm-text { font-family:'Cormorant Garamond',serif; font-style:italic; font-weight:300; font-size:clamp(17px,2.4vw,26px); color:#ccc; line-height:1.85; text-align:center; max-width:480px; }

  /* Progress dots */
  .ts-dots { position:absolute; bottom:32px; left:0; right:0; display:flex; justify-content:center; gap:7px; }
  .ts-dot { width:4px; height:4px; border-radius:50%; background:#1c1c1c; transition:background .4s; }
  .ts-dot.active { background:#fff; }
  .ts-dot.done   { background:#333; }

  @media (max-width:540px) {
    .ts-phone-row { flex-direction:column; gap:0; }
    .ts-cc { width:100%; }
    .ts-otp-box { width:40px; height:50px; font-size:20px; }
  }
`

if (typeof document !== 'undefined' && !document.getElementById('ts-styles')) {
  const s = document.createElement('style')
  s.id = 'ts-styles'
  s.textContent = css
  document.head.appendChild(s)
}

// ═══════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════
const COUNTRY_CODES = [
  { code: '+91',  label: '+91  IN' },
  { code: '+1',   label: '+1   US' },
  { code: '+44',  label: '+44  GB' },
  { code: '+971', label: '+971 AE' },
  { code: '+65',  label: '+65  SG' },
  { code: '+852', label: '+852 HK' },
  { code: '+61',  label: '+61  AU' },
  { code: '+33',  label: '+33  FR' },
  { code: '+49',  label: '+49  DE' },
  { code: '+81',  label: '+81  JP' },
]

const NET_WORTH = ['₹10 Cr – ₹50 Cr', '₹50 Cr – ₹100 Cr', '₹100 Cr+']

/*
  STEP MAP:
    0  — Disclaimer
    1  — Legal Name
    2  — Phone entry
    3  — Phone OTP verify        ← NEW
    4  — Email entry
    5  — Email OTP verify        ← NEW
    6  — Net Worth
    7  — Why Reconstruct
    8  — Sacrifice
    9  — Referral
    10 — Final / Submit
    11 — Confirmation
*/
const TOTAL_FORM_STEPS = 10   // steps 1–10 shown in progress dots

const INITIAL_FORM = {
  name: '', countryCode: '+91', phone: '',
  email: '', netWorth: '',
  whyReconstruct: '', sacrifice: '', referral: '',
}
const INITIAL_VERIFIED = { phone: false, email: false }

// ═══════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════
function validateStep(step, form) {
  switch (step) {
    case 0:  return ''
    case 1: {
      if (!form.name.trim())          return 'Legal name is required'
      if (form.name.trim().length<2)  return 'Name must be at least 2 characters'
      if (!/^[a-zA-Z\s.'`\-]+$/.test(form.name)) return 'Name contains invalid characters'
      return ''
    }
    case 2: {
      const d = form.phone.replace(/\D/g,'')
      if (!form.phone.trim())          return 'Contact number is required'
      if (!/^[\d\s\-().]+$/.test(form.phone)) return 'Enter digits only'
      if (d.length < 7)                return 'Number is too short'
      if (d.length > 15)               return 'Number is too long'
      return ''
    }
    case 3:  return ''   // OTP step — validated by API response
    case 4: {
      if (!form.email.trim())          return 'Email address is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return 'Enter a valid email address'
      return ''
    }
    case 5:  return ''   // OTP step
    case 6:  return form.netWorth ? '' : 'Select your net worth bracket'
    case 7: {
      if (!form.whyReconstruct.trim()) return 'This field is required'
      if (form.whyReconstruct.trim().length < 30) return `Minimum 30 characters (${form.whyReconstruct.trim().length}/30)`
      return ''
    }
    case 8: {
      if (!form.sacrifice.trim())      return 'This field is required'
      if (form.sacrifice.trim().length < 20) return `Minimum 20 characters (${form.sacrifice.trim().length}/20)`
      return ''
    }
    case 9: {
      if (!form.referral.trim())       return 'Referral is required'
      if (form.referral.trim().length<2) return 'Enter a valid name'
      return ''
    }
    default: return ''
  }
}

// ═══════════════════════════════════════════════
//  API helpers
// ═══════════════════════════════════════════════
async function apiCall(url, body) {
  const res  = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

// ═══════════════════════════════════════════════
//  OTP INPUT — 6 boxes
// ═══════════════════════════════════════════════
function OtpBoxes({ value, onChange, hasError }) {
  const boxes = useRef([])
  const digits = value.padEnd(6, ' ').split('')

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.map((d, idx) => idx === i ? ' ' : d).join('').trimEnd()
      onChange(next)
      if (i > 0) boxes.current[i - 1]?.focus()
      return
    }
    if (!/^\d$/.test(e.key)) return
    e.preventDefault()
    const next = [...digits]; next[i] = e.key
    onChange(next.join('').trimEnd())
    if (i < 5) boxes.current[i + 1]?.focus()
  }

  const handlePaste = e => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (pasted) {
      onChange(pasted)
      boxes.current[Math.min(pasted.length, 5)]?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="ts-otp-row">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => boxes.current[i] = el}
          className={`ts-otp-box${hasError ? ' err' : ''}${d.trim() ? ' filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          readOnly
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════
//  SMALL COMPONENTS
// ═══════════════════════════════════════════════
function Err({ msg })    { return <div className={`ts-err${msg ? ' show' : ''}`}>{msg}</div> }
function OkMsg({ msg })  { return <div className={`ts-ok${msg ? ' show' : ''}`}>{msg}</div> }
function Spinner()       { return <span className="ts-spin" /> }

// ═══════════════════════════════════════════════
//  VIDEO PLAYER
// ═══════════════════════════════════════════════
function VideoPlayer({ src = '' }) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef(null)
  const toggle = () => {
    if (!ref.current) return
    playing ? (ref.current.pause(), setPlaying(false)) : (ref.current.play(), setPlaying(true))
  }
  return (
    <div className="ts-video-section ts-fade" style={{ animationDelay:'1.3s' }}>
      <p className="ts-video-label">Manifesto</p>
      <div className="ts-video-wrap">
        <video ref={ref} src={src} playsInline onEnded={() => setPlaying(false)} />
        {!playing && (
          <div className="ts-play-overlay" onClick={toggle}>
            <div className="ts-play-circle"><div className="ts-play-tri" /></div>
          </div>
        )}
        {playing && <div className="ts-play-overlay" onClick={toggle} style={{ background:'transparent' }} />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════
//  OTP VERIFY STEP (reused for both phone & email)
// ═══════════════════════════════════════════════
function OtpStep({ type, target, displayTarget, onVerified, onBack }) {
  const [otp,       setOtp]       = useState('')
  const [err,       setErr]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [timer,     setTimer]     = useState(0)
  const [apiErr,    setApiErr]    = useState('')

  // Auto-send OTP on mount
  useEffect(() => { handleSend() }, [])

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [timer])

  const handleSend = async () => {
    setSending(true); setApiErr(''); setOtp('')
    try {
      await apiCall('/api/otp/send', { target, type, countryCode: type === 'phone' ? window.__tsCountryCode || '+91' : undefined })
      setSent(true)
      setTimer(60)
    } catch (e) { setApiErr(e.message) }
    finally { setSending(false) }
  }

  const handleVerify = async () => {
    if (otp.replace(/\s/g,'').length < 6) { setErr('Enter all 6 digits'); return }
    setLoading(true); setErr(''); setApiErr('')
    try {
      await apiCall('/api/otp/verify', { target, type, code: otp.replace(/\s/g,'') })
      onVerified()
    } catch (e) { setApiErr(e.message) }
    finally { setLoading(false) }
  }

  const icon  = type === 'phone' ? '📱' : '✉️'
  const label = type === 'phone' ? 'Phone Verification' : 'Email Verification'
  const hint  = type === 'phone'
    ? `A 6-digit code was sent via SMS to ${displayTarget}`
    : `A 6-digit code was sent to ${displayTarget}`

  return (
    <div className="ts-step">
      <p className="ts-step-label">{label}</p>
      <p className="ts-step-prompt ts-step-prompt-sm" style={{ marginBottom: 16 }}>
        Enter Verification Code.
      </p>
      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#555', marginBottom:36, lineHeight:1.6 }}>
        {sending ? 'Sending code…' : sent ? hint : 'Requesting code…'}
      </p>

      <OtpBoxes value={otp} onChange={v => { setOtp(v); setErr(''); setApiErr('') }} hasError={!!err || !!apiErr} />

      <Err msg={err || apiErr} />

      <button
        className="ts-next"
        style={{ marginTop: 36 }}
        onClick={handleVerify}
        disabled={loading || otp.replace(/\s/g,'').length < 6}
      >
        {loading ? <><Spinner />Verifying…</> : <>Verify <span className="ts-arrow" /></>}
      </button>

      {/* Resend / timer */}
      <div style={{ marginTop: 24 }}>
        {timer > 0 ? (
          <p className="ts-timer">Resend available in {timer}s</p>
        ) : (
          <button className="ts-otp-send" onClick={handleSend} disabled={sending}>
            {sending ? <><Spinner />Sending…</> : 'Resend Code'}
          </button>
        )}
      </div>

      {/* Back link */}
      <button
        style={{ background:'none', border:'none', color:'#2a2a2a', fontFamily:"'DM Sans',sans-serif", fontSize:10, letterSpacing:'.15em', textTransform:'uppercase', cursor:'pointer', marginTop:20, transition:'color .3s' }}
        onClick={onBack}
        onMouseEnter={e => e.target.style.color='#888'}
        onMouseLeave={e => e.target.style.color='#2a2a2a'}
      >
        ← Change {type === 'phone' ? 'number' : 'email'}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════
//  FORM OVERLAY
// ═══════════════════════════════════════════════
function FormOverlay({ onClose }) {
  const [visible,    setVisible]    = useState(false)
  const [step,       setStep]       = useState(0)
  const [form,       setForm]       = useState(INITIAL_FORM)
  const [verified,   setVerified]   = useState(INITIAL_VERIFIED)
  const [err,        setErr]        = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [apiErr,     setApiErr]     = useState('')
  const inputRef = useRef(null)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [step])

  // Store countryCode globally for OtpStep to pick up
  useEffect(() => { window.__tsCountryCode = form.countryCode }, [form.countryCode])

  // Auto-close after confirmation
  useEffect(() => {
    if (step !== 11) return
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => { setStep(0); setForm(INITIAL_FORM); setVerified(INITIAL_VERIFIED); onClose() }, 800)
    }, 4000)
    return () => clearTimeout(t)
  }, [step, onClose])

  const setField = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErr(''); setApiErr('') }

  const handleClose = () => { setVisible(false); setTimeout(onClose, 800) }

  const advance = async () => {
    const msg = validateStep(step, form)
    if (msg) { setErr(msg); return }
    setErr('')

    if (step === 10) {
      // Final submit
      setSubmitting(true); setApiErr('')
      try {
        await fetch('/api/submit', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...form, phoneVerified: 'true', emailVerified: 'true' }),
        }).then(async r => {
          const d = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(d.message || 'Submission failed')
        })
        setStep(11)
      } catch (e) { setApiErr(e.message) }
      finally { setSubmitting(false) }
      return
    }

    setStep(s => s + 1)
  }

  // Progress dot position: map step to 1–10 visible position
  // OTP steps 3 and 5 share a dot with their input step (2 and 4)
  const dotStep = step >= 6 ? step - 2 : step >= 4 ? step - 1 : step

  const renderStep = () => {
    switch (step) {

      /* 0 — Disclaimer */
      case 0: return (
        <div className="ts-step">
          <p className="ts-disclaimer-text">
            "Warning: Submitting this request does not guarantee acceptance.
            Our selection process is strictly vetted."
          </p>
          <button className="ts-cta" onClick={advance}>Begin</button>
        </div>
      )

      /* 1 — Legal Name */
      case 1: return (
        <div className="ts-step">
          <p className="ts-step-label">Step 1 of 10</p>
          <label className="ts-step-prompt">Legal Name.</label>
          <input ref={inputRef} className={`ts-input${err?' err':''}`} type="text"
            placeholder="Your full legal name" value={form.name}
            onChange={e => setField('name', e.target.value)}
            onKeyDown={e => e.key==='Enter' && advance()} />
          <Err msg={err} />
          <button className="ts-next" onClick={advance}>Continue <span className="ts-arrow"/></button>
        </div>
      )

      /* 2 — Phone entry */
      case 2: return (
        <div className="ts-step">
          <p className="ts-step-label">Step 2 of 10</p>
          <label className="ts-step-prompt">Direct Contact Number.</label>
          <div className="ts-phone-row">
            <select className={`ts-cc${err?' err':''}`} value={form.countryCode}
              onChange={e => setField('countryCode', e.target.value)}>
              {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            <input ref={inputRef} className={`ts-input${err?' err':''}`} type="tel"
              placeholder="00000 00000" value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              onKeyDown={e => e.key==='Enter' && advance()}
              style={{ flex:1 }} />
          </div>
          <Err msg={err} />
          <button className="ts-next" onClick={advance}>
            Continue <span className="ts-arrow"/>
          </button>
        </div>
      )

      /* 3 — Phone OTP */
      case 3: return (
        <OtpStep
          type="phone"
          target={form.phone.replace(/\D/g,'')}
          displayTarget={`${form.countryCode} ${form.phone}`}
          onVerified={() => { setVerified(v => ({ ...v, phone: true })); setStep(4) }}
          onBack={() => setStep(2)}
        />
      )

      /* 4 — Email entry */
      case 4: return (
        <div className="ts-step">
          <p className="ts-step-label">Step 3 of 10</p>
          <label className="ts-step-prompt">Private Email Address.</label>
          {verified.phone && (
            <div className="ts-verified" style={{ marginBottom:20 }}>
              <span className="ts-verified-dot" />
              Phone verified
            </div>
          )}
          <input ref={inputRef} className={`ts-input${err?' err':''}`} type="email"
            placeholder="your@email.com" value={form.email}
            onChange={e => setField('email', e.target.value)}
            onKeyDown={e => e.key==='Enter' && advance()} />
          <Err msg={err} />
          <button className="ts-next" onClick={advance}>Continue <span className="ts-arrow"/></button>
        </div>
      )

      /* 5 — Email OTP */
      case 5: return (
        <OtpStep
          type="email"
          target={form.email.trim().toLowerCase()}
          displayTarget={form.email}
          onVerified={() => { setVerified(v => ({ ...v, email: true })); setStep(6) }}
          onBack={() => setStep(4)}
        />
      )

      /* 6 — Net Worth */
      case 6: return (
        <div className="ts-step">
          <p className="ts-step-label">Step 4 of 10</p>
          <label className="ts-step-prompt ts-step-prompt-sm" style={{ marginBottom:36 }}>
            What is your current net worth bracket?
          </label>
          <div className="ts-nw-list">
            {NET_WORTH.map(nw => (
              <button key={nw} className={`ts-nw-opt${form.netWorth===nw?' sel':''}`}
                onClick={() => setField('netWorth', nw)}>
                {nw}
              </button>
            ))}
          </div>
          <Err msg={err} />
          {form.netWorth && (
            <button className="ts-next" onClick={advance}>Continue <span className="ts-arrow"/></button>
          )}
        </div>
      )

      /* 7 — Why Reconstruct */
      case 7: return (
        <div className="ts-step">
          <p className="ts-step-label">Step 5 of 10</p>
          <label className="ts-step-prompt ts-step-prompt-sm">
            Why do you require a total physical and psychological reconstruction
            at this stage in your life?
          </label>
          <textarea ref={inputRef} className={`ts-textarea${err?' err':''}`}
            placeholder="Be candid." value={form.whyReconstruct}
            onChange={e => setField('whyReconstruct', e.target.value)} />
          <Err msg={err} />
          <button className="ts-next" onClick={advance}>Continue <span className="ts-arrow"/></button>
        </div>
      )

      /* 8 — Sacrifice */
      case 8: return (
        <div className="ts-step">
          <p className="ts-step-label">Step 6 of 10</p>
          <label className="ts-step-prompt ts-step-prompt-sm">
            This protocol requires surrendering complete control of your schedule,
            habits, and aesthetics. What is the absolute maximum you are willing
            to sacrifice?
          </label>
          <textarea ref={inputRef} className={`ts-textarea${err?' err':''}`}
            placeholder="No limits." value={form.sacrifice}
            onChange={e => setField('sacrifice', e.target.value)} />
          <Err msg={err} />
          <button className="ts-next" onClick={advance}>Continue <span className="ts-arrow"/></button>
        </div>
      )

      /* 9 — Referral */
      case 9: return (
        <div className="ts-step">
          <p className="ts-step-label">Step 7 of 10</p>
          <label className="ts-step-prompt">Who referred you to True Shape?</label>
          <input ref={inputRef} className={`ts-input${err?' err':''}`} type="text"
            placeholder="Full name or handle" value={form.referral}
            onChange={e => setField('referral', e.target.value)}
            onKeyDown={e => e.key==='Enter' && advance()} />
          <Err msg={err} />
          <button className="ts-next" onClick={advance}>Continue <span className="ts-arrow"/></button>
        </div>
      )

      /* 10 — Final / Submit */
      case 10: return (
        <div className="ts-step">
          <p className="ts-step-label">Final Step</p>
          <p className="ts-final-note">
            Your dossier is complete. By submitting, you acknowledge that all
            information is accurate and that True Shape may retain it indefinitely
            under strict confidentiality.
          </p>
          {/* Show verification badges */}
          <div style={{ display:'flex', gap:24, marginBottom:32 }}>
            {verified.phone && (
              <div className="ts-verified"><span className="ts-verified-dot" />Phone verified</div>
            )}
            {verified.email && (
              <div className="ts-verified"><span className="ts-verified-dot" />Email verified</div>
            )}
          </div>
          {apiErr && (
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, letterSpacing:'.1em', color:'#8b2222', marginBottom:20, textTransform:'uppercase' }}>
              {apiErr}
            </p>
          )}
          <button className="ts-submit" onClick={advance} disabled={submitting}>
            {submitting ? <><Spinner />Transmitting…</> : 'Submit Dossier'}
          </button>
        </div>
      )

      /* 11 — Confirmation */
      case 11: return (
        <div className="ts-confirm">
          <div className="ts-confirm-line" />
          <p className="ts-confirm-label">Received</p>
          <p className="ts-confirm-text">
            "Your request has been logged. If you meet our baseline criteria,
            your handler will contact you."
          </p>
          <div className="ts-confirm-line" style={{ background:'#161616', marginTop:28 }} />
        </div>
      )

      default: return null
    }
  }

  // Dot count: 10 visible steps (1–10), OTP steps share a dot with their input step
  const visibleStep = step === 0 ? 0
    : step === 3 ? 2    // phone OTP shares dot with phone entry
    : step === 5 ? 4    // email OTP shares dot with email entry
    : step > 5   ? step - 2
    : step > 3   ? step - 1
    : step

  return (
    <div className="ts-overlay" style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'all' : 'none' }}>
      <div className="ts-overlay-top">
        <span className="ts-overlay-logo">TRUE SHAPE</span>
        {step < 11 && <button className="ts-close" onClick={handleClose} aria-label="Close">✕</button>}
      </div>

      {renderStep()}

      {/* Progress dots — steps 1–10 */}
      {step >= 1 && step <= 10 && (
        <div className="ts-dots">
          {Array.from({ length: 10 }, (_, i) => {
            const n = i + 1
            return (
              <div key={i} className={`ts-dot${n === visibleStep ? ' active' : n < visibleStep ? ' done' : ''}`} />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════
export default function App() {
  const [ready,    setReady]    = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 180)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="ts-page">
      <header className="ts-header" style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.2s ease' }}>
        <div className="ts-logo">TRUE SHAPE</div>
      </header>

      <main className="ts-hero">
        {ready && (
          <>
            <div className="ts-rule-top ts-fade" style={{ animationDelay:'0.1s' }} />
            <h1 className="ts-headline ts-fade" style={{ animationDelay:'0.35s' }}>
              Absolute Human Optimization<br />for the Elite.
            </h1>
            <p className="ts-subheadline ts-fade" style={{ animationDelay:'0.65s' }}>
              A closed-door syndicate for physical, psychological,
              and behavioral mastery.
            </p>
            <div className="ts-fade" style={{ animationDelay:'0.9s' }}>
              <button className="ts-cta" onClick={() => setShowForm(true)}>Request Access</button>
            </div>
            <div className="ts-rule-bot ts-fade" style={{ animationDelay:'1.05s' }} />
            {/* Replace src="" with your video path e.g. src="/manifesto.mp4" */}
            <VideoPlayer src="" />
          </>
        )}
      </main>

      <footer className="ts-footer" style={{ opacity: ready ? 1 : 0, transition: 'opacity 2s ease 1.6s' }}>
        <p>© 2026 True Shape. All rights reserved. Strict NDAs apply.</p>
      </footer>

      {showForm && <FormOverlay onClose={() => setShowForm(false)} />}
    </div>
  )
}