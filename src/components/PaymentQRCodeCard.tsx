import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { 
  QrCode, 
  Smartphone, 
  Building2, 
  Download, 
  Check, 
  Edit, 
  Save, 
  Copy, 
  Info, 
  Share2, 
  Wallet,
  PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentQRCodeCardProps {
  student: Student;
  amount: string | number;
  month: string;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Bank';
  language: 'en' | 'bn';
}

interface MerchantSettings {
  bkashNumber: string;
  nagadNumber: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
}

const DEFAULT_SETTINGS: MerchantSettings = {
  bkashNumber: '01782392019',
  nagadNumber: '01928301928',
  bankName: 'BRAC Bank PLC',
  accountName: 'Pragya Academy Ltd.',
  accountNumber: '1501204829103001',
  routingNumber: '040262182',
};

const STORAGE_KEY = 'PRAGYA_MERCHANT_GATEWAY_SETTINGS';

export default function PaymentQRCodeCard({
  student,
  amount,
  month,
  paymentMethod,
  language,
}: PaymentQRCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Local active merchant credentials loaded from localStorage or defaults
  const [settings, setSettings] = useState<MerchantSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse merchant settings', e);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setIsEditing(false);
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setIsEditing(false);
  };

  // Compute payment reference and details
  const finalAmount = parseFloat(amount.toString()) || student.finalFee || 0;
  const studentId = student.id;
  const studentName = student.name;
  const monthName = month || 'Current';

  // Construct QR Payload details based on payment method
  let qrValue = '';
  let brandColor = 'indigo';
  let bannerBg = 'bg-indigo-600 dark:bg-indigo-700';
  let bannerText = 'text-white';
  let methodTitle = '';
  let instruction = '';

  if (paymentMethod === 'bKash') {
    qrValue = `bkash://payment?receiver=${settings.bkashNumber}&amount=${finalAmount}&reference=${studentId}&month=${monthName}&source=PragyaAcademy`;
    brandColor = 'pink';
    bannerBg = 'bg-[#E2136E]';
    methodTitle = language === 'en' ? 'bKash Payment' : 'বিকাশ পেমেন্ট';
    instruction = language === 'en' 
      ? `Scan to pay BDT ${finalAmount} to bKash Merchant Account ${settings.bkashNumber}. Reference: ${studentId}`
      : `বিকাশ মার্চেন্ট অ্যাকাউন্ট ${settings.bkashNumber}-এ BDT ${finalAmount} প্রদান করতে স্ক্যান করুন। রেফারেন্স: ${studentId}`;
  } else if (paymentMethod === 'Nagad') {
    qrValue = `nagad://payment?receiver=${settings.nagadNumber}&amount=${finalAmount}&reference=${studentId}&month=${monthName}&source=PragyaAcademy`;
    brandColor = 'orange';
    bannerBg = 'bg-[#E3541E]';
    methodTitle = language === 'en' ? 'Nagad Payment' : 'নগদ পেমেন্ট';
    instruction = language === 'en'
      ? `Scan to pay BDT ${finalAmount} to Nagad Merchant Account ${settings.nagadNumber}. Reference: ${studentId}`
      : `নগদ মার্চেন্ট অ্যাকাউন্ট ${settings.nagadNumber}-এ BDT ${finalAmount} প্রদান করতে স্ক্যান করুন। রেফারেন্স: ${studentId}`;
  } else if (paymentMethod === 'Bank') {
    qrValue = `bank://transfer?bank=${encodeURIComponent(settings.bankName)}&account=${settings.accountNumber}&holder=${encodeURIComponent(settings.accountName)}&amount=${finalAmount}&routing=${settings.routingNumber}&reference=${studentId}`;
    brandColor = 'blue';
    bannerBg = 'bg-[#0B4A8F]';
    methodTitle = language === 'en' ? 'Bank Transfer' : 'ব্যাংক ট্রান্সফার';
    instruction = language === 'en'
      ? `Deposit BDT ${finalAmount} to BRAC Bank Account: ${settings.accountNumber} (${settings.accountName}).`
      : `ব্র্যাক ব্যাংক অ্যাকাউন্ট নম্বর: ${settings.accountNumber} (${settings.accountName})-এ BDT ${finalAmount} জমা দিন।`;
  } else {
    // Cash / Counter checkin
    qrValue = `pragya://checkin?studentId=${studentId}&name=${encodeURIComponent(studentName)}&fee=${finalAmount}&month=${monthName}`;
    brandColor = 'slate';
    bannerBg = 'bg-slate-900';
    methodTitle = language === 'en' ? 'Cash Counter Check-In' : 'নগদ কাউন্টার ক্যাশ-ইন';
    instruction = language === 'en'
      ? `Verify student ID #${studentId} at reception to collect BDT ${finalAmount} cash payment.`
      : `রিসেপশনে টাকা গ্রহণের জন্য শিক্ষার্থী আইডি #${studentId} স্ক্যান করে নিশ্চিত করুন। পরিমাণ: BDT ${finalAmount}`;
  }

  // Draw QR code with High Error-Correction to handle central overlay badge seamlessly
  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrValue,
        {
          width: 190,
          margin: 1,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#0f172a', // deep slate dark
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [qrValue, paymentMethod]);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `payment-qr-${studentId}-${monthName}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="bg-card rounded-[2rem] md:rounded-[2.5rem] border border-border shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col overflow-hidden">
      {/* Banner Header with dynamic gateway branding */}
      <div className={`p-6 text-white ${bannerBg} transition-colors duration-500 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 opacity-45" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-100/75">
                {language === 'en' ? 'InstaPay Secure Code' : 'ইন্সটাপে সুরক্ষিত কোড'}
              </p>
              <h4 className="text-base md:text-lg font-black tracking-tight">{methodTitle}</h4>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all backdrop-blur-sm"
          >
            {isEditing 
              ? (language === 'en' ? 'Close' : 'বন্ধ করুন') 
              : (language === 'en' ? 'Edit Gateways' : 'গেটওয়ে এডিট')}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 md:p-8 space-y-4 bg-muted/10 border-b border-border"
          >
            <h5 className="text-[10px] font-black text-muted uppercase tracking-widest">
              {language === 'en' ? 'Configure Payment Addresses' : 'পেমেন্ট এড্রেস সেট করুন'}
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">bKash Number</label>
                <input
                  type="text"
                  value={settings.bkashNumber}
                  onChange={e => setSettings(prev => ({ ...prev, bkashNumber: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-border focus:border-pink-500 rounded-xl bg-card text-xs font-bold font-mono text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Nagad Number</label>
                <input
                  type="text"
                  value={settings.nagadNumber}
                  onChange={e => setSettings(prev => ({ ...prev, nagadNumber: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-border focus:border-orange-500 rounded-xl bg-card text-xs font-bold font-mono text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Bank Name</label>
                <input
                  type="text"
                  value={settings.bankName}
                  onChange={e => setSettings(prev => ({ ...prev, bankName: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-border focus:border-blue-500 rounded-xl bg-card text-xs font-bold text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Account Holder Name</label>
                <input
                  type="text"
                  value={settings.accountName}
                  onChange={e => setSettings(prev => ({ ...prev, accountName: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-border focus:border-blue-500 rounded-xl bg-card text-xs font-bold text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Bank Account Number</label>
                <input
                  type="text"
                  value={settings.accountNumber}
                  onChange={e => setSettings(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-border focus:border-blue-500 rounded-xl bg-card text-xs font-bold font-mono text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase">Routing Number</label>
                <input
                  type="text"
                  value={settings.routingNumber}
                  onChange={e => setSettings(prev => ({ ...prev, routingNumber: e.target.value }))}
                  className="w-full px-3 py-2 border-2 border-border focus:border-blue-500 rounded-xl bg-card text-xs font-bold font-mono text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-3 bg-slate-900 dark:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all hover:bg-indigo-600 flex items-center justify-center gap-1.5"
              >
                <Save size={12} />
                {language === 'en' ? 'Save Settings' : 'সেভ করুন'}
              </button>
              <button
                onClick={handleResetSettings}
                className="py-3 px-4 border border-border hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-muted font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
              >
                {language === 'en' ? 'Reset Defaults' : 'ডিফল্ট করুন'}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Main QR Code & Details Layout */}
      <div className="p-6 md:p-8 flex flex-col items-center justify-center space-y-6 flex-1 bg-card">
        
        {/* The QR Canvas wrapper */}
        <div className="relative group/qr p-4 rounded-3xl bg-card text-card-foreground border-4 border-border/50 shadow-lg dark:border-none flex items-center justify-center">
          
          <canvas ref={canvasRef} className="rounded-xl w-[190px] h-[190px]" />
          
          {/* Absolute overlay brand icon in the exact center of QR code for pristine look */}
          <div className="absolute w-12 h-12 rounded-2xl bg-card text-card-foreground shadow-xl flex items-center justify-center border-4 border-white pointer-events-none transition-transform group-hover/qr:scale-110">
            {paymentMethod === 'bKash' && (
              <div className="w-full h-full bg-[#E2136E]/10 rounded-xl flex items-center justify-center font-black text-[#E2136E] text-xs">
                bK
              </div>
            )}
            {paymentMethod === 'Nagad' && (
              <div className="w-full h-full bg-[#E3541E]/10 rounded-xl flex items-center justify-center font-black text-[#E3541E] text-xs">
                N
              </div>
            )}
            {paymentMethod === 'Bank' && (
              <Building2 size={16} className="text-[#0B4A8F]" />
            )}
            {paymentMethod === 'Cash' && (
              <div className="w-full h-full bg-muted/20 rounded-xl flex items-center justify-center font-black text-foreground text-[10px]">
                PRAGYA
              </div>
            )}
          </div>
        </div>

        {/* Dynamic transaction invoice values */}
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-muted leading-relaxed">
            {instruction}
          </p>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-900/50 mt-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              BDT {finalAmount.toLocaleString()} • {monthName}
            </span>
          </span>
        </div>

        <div className="w-full pt-4 border-t border-border space-y-3">
          {/* Dynamic details drawer */}
          <div className="p-3.5 bg-muted/5 rounded-2xl border border-dashed border-border text-xs font-bold space-y-1.5">
            <div className="flex justify-between text-[10px] uppercase font-black text-muted tracking-wide">
              <span>{language === 'en' ? 'PAYMENT GATEWAY DETAILS' : 'পেমেন্ট গেটওয়ে বিবরণ'}</span>
              <span className="text-indigo-600 dark:text-indigo-400">ACTIVE</span>
            </div>
            
            {paymentMethod === 'bKash' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted">bKash Number:</span>
                  <span className="font-mono text-foreground">{settings.bkashNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Type:</span>
                  <span className="font-black text-foreground">Merchant Wallet (API enabled)</span>
                </div>
              </>
            )}

            {paymentMethod === 'Nagad' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted">Nagad Number:</span>
                  <span className="font-mono text-foreground">{settings.nagadNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Type:</span>
                  <span className="font-black text-foreground">Merchant Wallet</span>
                </div>
              </>
            )}

            {paymentMethod === 'Bank' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted">Bank:</span>
                  <span className="font-black text-foreground">{settings.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">A/C:</span>
                  <span className="font-mono text-foreground truncate max-w-[120px]" title={settings.accountNumber}>
                    {settings.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Routing:</span>
                  <span className="font-mono text-muted-foreground">{settings.routingNumber}</span>
                </div>
              </>
            )}

            {paymentMethod === 'Cash' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted">Check-In Type:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Direct Cash Voucher</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Student ID:</span>
                  <span className="font-mono text-foreground">{studentId}</span>
                </div>
              </>
            )}

            <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
              <span className="text-muted">{language === 'en' ? 'Reference' : 'রেফারেন্স (আইডি)'}:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{studentId}</span>
            </div>
          </div>

          {/* Action buttons list */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="py-3 px-4 border-2 border-border dark:bg-slate-800 hover:border-indigo-500 hover:bg-indigo-50/15 text-foreground font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  <span className="text-emerald-500">{language === 'en' ? 'Copied' : 'কপি হয়েছে'}</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>{language === 'en' ? 'Copy Link' : 'কপি লিংক'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="py-3 px-4 bg-indigo-600 hover:bg-slate-900 hover:text-white dark:hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-92"
            >
              {downloaded ? (
                <>
                  <Check size={12} />
                  <span>{language === 'en' ? 'Saved' : 'সেভ হয়েছে'}</span>
                </>
              ) : (
                <>
                  <Download size={12} />
                  <span>{language === 'en' ? 'Download' : 'ডাউনলোড'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
