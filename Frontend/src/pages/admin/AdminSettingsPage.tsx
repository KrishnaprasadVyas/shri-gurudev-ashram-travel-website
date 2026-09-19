import { useState } from 'react'
import {
  Settings,
  Building,
  CreditCard,
  QrCode,
  Bell,
  ShieldAlert,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminSettingsPage() {
  usePageTitle('Settings & Configuration | Admin')

  const [bankName, setBankName] = useState('State Bank of India')
  const [accountNumber, setAccountNumber] = useState('38947291048')
  const [ifsc, setIfsc] = useState('SBIN0001234')
  const [branch, setBranch] = useState('Katra Shrine Branch')
  const [upiId, setUpiId] = useState('shrigurudevashram@sbi')
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    toast.success('Ashram settings saved successfully!')
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-8 text-[#3E2B1F] pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-[#B8860B]" />
          <span className="font-label-caps text-xs font-bold text-[#B8860B] uppercase tracking-wider">
            Platform Configuration
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#3E2B1F]">
          Ashram System Settings
        </h1>
        <p className="text-sm text-[#6F5B47] mt-0.5">
          Official bank offering details, offline UPI QR code metadata, and gateway modes.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Ashram Bank Account Card */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#B8860B] pb-2 border-b border-[#E9DCC5]/60">
            <Building className="h-5 w-5" />
            <h3 className="font-display text-lg font-bold text-[#3E2B1F]">
              Ashram Official Bank Details (Devotee Offerings)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-mono text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-mono text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
                Branch Location
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
              />
            </div>
          </div>
        </div>

        {/* UPI & QR Section */}
        <div className="p-6 rounded-[24px] bg-[#FFFFFF] border border-[#E9DCC5] shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-[#B8860B] pb-2 border-b border-[#E9DCC5]/60">
            <QrCode className="h-5 w-5" />
            <h3 className="font-display text-lg font-bold text-[#3E2B1F]">
              Official UPI VPA & QR Code Configuration
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6F5B47] uppercase tracking-wider mb-1">
              Ashram UPI VPA Handle
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E9DCC5] text-sm font-mono text-[#3E2B1F] focus:outline-none focus:border-[#B8860B]"
            />
            <p className="text-xs text-[#9A8A78] mt-1">
              Shown to devotees choosing direct bank transfer / offline payment.
            </p>
          </div>
        </div>

        {/* Phase 1 Automation Notice */}
        <div className="p-6 rounded-[24px] bg-[#FFF7E8] border border-[#B8860B]/30 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#B8860B]">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="font-display text-base font-bold text-[#3E2B1F]">
              Phase 1 Architectural Scope
            </h3>
          </div>
          <p className="text-xs text-[#6F5B47] leading-relaxed">
            • <strong>WhatsApp Automation:</strong> Inactive in Phase 1 as approved in architecture decisions. Devotee WhatsApp numbers are captured as mandatory records for manual communication.
            <br />
            • <strong>Akbar API:</strong> Uses manual export → Akbar portal → PDF upload workflow. Direct API integration hooks are ready for future phase.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#B8860B] text-white font-bold text-sm hover:bg-[#8C6A0A] shadow-md transition-all cursor-pointer"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{saved ? 'Saved!' : 'Save Ashram Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
