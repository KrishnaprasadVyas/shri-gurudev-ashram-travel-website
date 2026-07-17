import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Upload, Loader2, ShieldCheck, Shield, Clock, FileCheck, UserCheck, Lock, Eye, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useVerification } from '@/hooks/useVerification'
import { usePageTitle } from '@/hooks/usePageTitle'
import { toast } from 'sonner'

const STEPS = ['Aadhaar Number', 'Aadhaar Image', 'Selfie', 'Review & Submit']

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-display text-sm font-bold transition-all duration-300 shadow-2xs ${
              i < current
                ? 'bg-[#2E7D32] text-white'
                : i === current
                  ? 'bg-[#B8860B]/15 border-2 border-[#B8860B] text-[#B8860B]'
                  : 'bg-[#F5EFE4] text-[#6F5B47]/60 border border-[#E9DCC5]'
            }`}
          >
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-6 sm:w-14 transition-colors duration-300 ${i < current ? 'bg-[#2E7D32]' : 'bg-[#E9DCC5]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function FileUploadField({
  label,
  onFileSelect,
  onUpload,
  uploaded,
  loading,
}: {
  label: string
  onFileSelect: (file: File) => void
  onUpload: () => void
  uploaded: boolean
  loading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#3E2B1F] font-semibold">{label}</p>
      <div
        className="border-2 border-dashed border-[#E9DCC5] rounded-3xl p-8 text-center cursor-pointer hover:border-[#B8860B] hover:bg-[#FFF7E8]/40 transition-all duration-300 bg-[#F5EFE4]/30"
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="Select file to upload"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      >
        {selectedFile ? (
          <div className="space-y-3">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="max-h-44 mx-auto rounded-2xl object-contain border border-[#E9DCC5] shadow-sm"
            />
            <p className="font-display text-sm font-bold text-[#3E2B1F] truncate max-w-[240px] mx-auto">{selectedFile.name}</p>
          </div>
        ) : (
          <div className="space-y-3 text-[#6F5B47]">
            <div className="w-14 h-14 rounded-2xl bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center mx-auto shadow-2xs">
              <Upload className="h-6 w-6 text-[#B8860B]" />
            </div>
            <p className="font-display text-base font-bold text-[#3E2B1F]">Click or tap to select image</p>
            <p className="text-xs text-[#6F5B47]">JPG, PNG up to 10MB</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>

      {uploaded ? (
        <div className="flex items-center gap-2 text-[#2E7D32] text-sm font-bold bg-[#2E7D32]/10 border border-[#2E7D32]/25 px-4 py-2.5 rounded-full inline-flex">
          <Check className="h-4 w-4" /> Uploaded successfully
        </div>
      ) : (
        <button
          onClick={onUpload}
          disabled={!selectedFile || loading}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#B8860B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] disabled:opacity-40 transition-all duration-250 cursor-pointer shadow-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload Image
        </button>
      )}
    </div>
  )
}

export function VerifyPage() {
  usePageTitle('Verify Identity')
  const { userProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { uploading, submitting, uploadAadhaar, uploadSelfie, submitVerification } = useVerification()

  const [step, setStep] = useState(0)
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [aadhaarError, setAadhaarError] = useState('')
  const [aadhaarImagePath, setAadhaarImagePath] = useState<string | null>(null)
  const [selfieImagePath, setSelfieImagePath] = useState<string | null>(null)
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  const verStatus = userProfile?.verification_status

  // ── Already submitted ──────────────────────────────────
  if (verStatus === 'submitted') {
    return (
      <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">Verification Queue</h1>
          <p className="text-sm text-[#6F5B47] mt-1 font-normal">Review status of your identity verification documents</p>
        </div>
        <div className="p-8 sm:p-10 rounded-3xl bg-[#FFFFFF] border border-[#C68A00]/30 shadow-[0_8px_30px_rgba(62,43,31,0.05)] text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#C68A00]/15 border border-[#C68A00]/30 flex items-center justify-center mx-auto shadow-sm">
            <Clock className="h-8 w-8 text-[#C68A00]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#3E2B1F]">Verification Under Review</h2>
          <p className="text-sm text-[#6F5B47] max-w-md mx-auto leading-relaxed">
            Your documents have been submitted and are being reviewed by Ashram administration. We&apos;ll notify you within 24 to 48 hours.
          </p>
          {/* Static Timeline */}
          <div className="pt-6 space-y-0 max-w-xs mx-auto text-left">
            {[
              { icon: FileCheck, label: 'Documents Submitted', status: 'done' },
              { icon: Eye, label: 'Under Review', status: 'current' },
              { icon: ShieldCheck, label: 'Approval Decision', status: 'pending' },
            ].map((item, i) => (
              <div key={item.label} className="flex items-start gap-3.5">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
                    item.status === 'done' ? 'bg-[#2E7D32] text-white' :
                    item.status === 'current' ? 'bg-[#C68A00]/15 text-[#C68A00] border border-[#C68A00]/30' :
                    'bg-[#F5EFE4] text-[#6F5B47]/50 border border-[#E9DCC5]'
                  }`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  {i < 2 && <div className={`w-0.5 h-7 ${item.status === 'done' ? 'bg-[#2E7D32]' : 'bg-[#E9DCC5]'}`} />}
                </div>
                <div className="pt-2">
                  <p className={`font-display text-sm font-bold ${item.status === 'done' ? 'text-[#2E7D32]' : item.status === 'current' ? 'text-[#C68A00]' : 'text-[#6F5B47]/60'}`}>
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Already verified ───────────────────────────────────
  if (verStatus === 'verified') {
    return (
      <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">Identity Verification</h1>
          <p className="text-sm text-[#6F5B47] mt-1 font-normal">Review your verified credentials</p>
        </div>

        {/* Hero Section with Shield */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] border border-[#2E7D32]/30 shadow-[0_8px_30px_rgba(62,43,31,0.05)] text-center space-y-5 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#2E7D32]/10 blur-3xl pointer-events-none" />
          <div className="w-20 h-20 rounded-2xl bg-[#2E7D32]/15 border border-[#2E7D32]/30 flex items-center justify-center mx-auto shadow-sm relative z-10">
            <ShieldCheck className="h-10 w-10 text-[#2E7D32]" />
          </div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#2E7D32]/15 border border-[#2E7D32]/30 text-[#2E7D32] font-label-caps text-[11px] font-bold uppercase tracking-wider mb-3">
              <Check className="h-3.5 w-3.5" /> Identity Confirmed
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F] mt-2">Already Verified ✓</h2>
            <p className="text-sm text-[#6F5B47] mt-2 max-w-md mx-auto leading-relaxed">Your identity has been verified by Ashram administration. You can now book Yatras and access all pilgrim services.</p>
          </div>
        </div>

        {/* Verification Details Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
          <h3 className="font-display text-lg font-bold text-[#3E2B1F] mb-4 pb-3 border-b border-[#E9DCC5]">Verification Details</h3>
          <div className="space-y-3">
            {[
              { label: 'Document Type', value: 'Aadhaar Card + Selfie' },
              { label: 'Status', value: 'Approved' },
              { label: 'Approved By', value: 'Ashram Administration' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-[#E9DCC5]/60 last:border-0">
                <span className="text-xs font-bold font-label-caps uppercase tracking-wider text-[#6F5B47]">{row.label}</span>
                <span className="font-display text-base font-bold text-[#3E2B1F]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Information */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)]">
          <h3 className="font-display text-lg font-bold text-[#3E2B1F] mb-5">Security Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: UserCheck, title: 'Verified Identity', desc: 'Your credentials have been authenticated.' },
              { icon: Shield, title: 'Safe Bookings', desc: 'Book with complete confidence across all Yatras.' },
              { icon: Lock, title: 'Fraud Prevention', desc: 'Your personal data is encrypted and safe.' },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-2xl bg-[#F5EFE4]/50 border border-[#E9DCC5] space-y-2.5 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E9DCC5] flex items-center justify-center shadow-2xs">
                  <item.icon className="h-5 w-5 text-[#B8860B]" />
                </div>
                <p className="font-display text-base font-bold text-[#3E2B1F]">{item.title}</p>
                <p className="text-xs text-[#6F5B47] leading-relaxed font-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleAadhaarContinue = () => {
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      setAadhaarError('Aadhaar must be exactly 12 digits')
      return
    }
    setAadhaarError('')
    setStep(1)
  }

  const handleUploadAadhaar = async () => {
    if (!aadhaarFile) return
    const path = await uploadAadhaar(aadhaarFile)
    if (path) {
      setAadhaarImagePath(path)
      toast.success('Aadhaar image uploaded!')
    }
  }

  const handleUploadSelfie = async () => {
    if (!selfieFile) return
    const path = await uploadSelfie(selfieFile)
    if (path) {
      setSelfieImagePath(path)
      toast.success('Selfie uploaded!')
    }
  }

  const handleSubmit = async () => {
    const success = await submitVerification({
      aadhaarNumber,
      aadhaarImagePath,
      selfieImagePath,
    })
    if (success) {
      await refreshProfile()
      toast.success('Verification submitted! 🙏')
      navigate('/portal/profile')
    }
  }

  const maskAadhaar = (num: string) =>
    num.length === 12 ? `XXXX XXXX ${num.slice(8)}` : num

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      {/* ── Page Header ──────────────────────────────────── */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3E2B1F] tracking-tight">Identity Verification</h1>
        <p className="text-sm text-[#6F5B47] mt-1 font-normal">Complete verification to book and attend sacred Yatras</p>
      </div>

      <StepIndicator current={step} total={STEPS.length} />

      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E9DCC5] shadow-[0_8px_30px_rgba(62,43,31,0.04)] transition-all duration-300">
        <h2 className="font-display text-xl font-bold text-[#3E2B1F] mb-1">Step {step + 1}: {STEPS[step]}</h2>

        {/* Step 1: Aadhaar number */}
        {step === 0 && (
          <div className="mt-6 space-y-5">
            <p className="text-sm text-[#6F5B47]">Please enter your exact 12-digit Aadhaar number</p>
            <input
              type="text"
              maxLength={12}
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="123456789012"
              className="w-full px-5 py-4 rounded-2xl bg-[#FAF7F2] border border-[#E9DCC5] text-[#3E2B1F] placeholder-[#6F5B47]/40 focus:outline-none focus:border-[#B8860B] focus:bg-[#FFFFFF] transition-all tracking-[0.3em] text-lg font-mono font-bold shadow-2xs"
              aria-label="Aadhaar number input"
            />
            {aadhaarError && (
              <p className="text-[#C0392B] text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> {aadhaarError}
              </p>
            )}
            <button
              onClick={handleAadhaarContinue}
              className="px-8 py-3.5 rounded-full bg-[#B8860B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] transition-all cursor-pointer shadow-sm"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Aadhaar image */}
        {step === 1 && (
          <div className="mt-6">
            <FileUploadField
              label="Upload a clear photo of your Aadhaar card (front side)"
              onFileSelect={setAadhaarFile}
              onUpload={handleUploadAadhaar}
              uploaded={Boolean(aadhaarImagePath)}
              loading={uploading}
            />
            <button
              onClick={() => setStep(2)}
              disabled={!aadhaarImagePath}
              className="mt-6 px-8 py-3.5 rounded-full bg-[#B8860B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 3: Selfie */}
        {step === 2 && (
          <div className="mt-6">
            <FileUploadField
              label="Take a clear selfie (face clearly visible, no sunglasses)"
              onFileSelect={setSelfieFile}
              onUpload={handleUploadSelfie}
              uploaded={Boolean(selfieImagePath)}
              loading={uploading}
            />
            <button
              onClick={() => setStep(3)}
              disabled={!selfieImagePath}
              className="mt-6 px-8 py-3.5 rounded-full bg-[#B8860B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="mt-6 space-y-6">
            <div className="p-6 rounded-2xl bg-[#F5EFE4]/60 border border-[#E9DCC5] space-y-3.5 shadow-2xs">
              {[
                { label: 'Aadhaar Number', value: maskAadhaar(aadhaarNumber), mono: true },
                { label: 'Aadhaar Image', value: 'Uploaded', check: true },
                { label: 'Selfie', value: 'Uploaded', check: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center text-sm py-1">
                  <span className="font-label-caps text-xs font-bold uppercase tracking-wider text-[#6F5B47]">{row.label}</span>
                  {row.check ? (
                    <span className="text-[#2E7D32] text-xs font-bold flex items-center gap-1.5 bg-[#2E7D32]/10 border border-[#2E7D32]/25 px-3 py-1 rounded-full">
                      <Check className="h-3.5 w-3.5" /> {row.value}
                    </span>
                  ) : (
                    <span className={`font-display text-base font-bold text-[#3E2B1F] ${row.mono ? 'font-mono tracking-wider' : ''}`}>{row.value}</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-full bg-[#B8860B] text-white font-bold hover:bg-[#D4AF37] disabled:opacity-50 transition-all text-sm tracking-wider uppercase cursor-pointer shadow-md hover:-translate-y-0.5"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : '🙏 Submit for Verification'}
            </button>
          </div>
        )}
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="text-xs font-bold uppercase tracking-wider text-[#6F5B47] hover:text-[#3E2B1F] transition-colors cursor-pointer"
        >
          ← Back
        </button>
      )}
    </div>
  )
}
