import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const ContactSection: React.FC = () => {
  const [form, setForm] = useState({
    fullName: '',
    mobileNumber: '',
    emailAddress: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 640);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from('contact_submissions').insert({
      full_name: form.fullName,
      mobile_number: form.mobileNumber,
      email: form.emailAddress,
      subject: form.subject,
      message: form.message,
    });
    setSending(false);
    if (error) {
      toast.error('Failed to send message. Please try again or contact us directly.');
      return;
    }
    toast.success("Thank you! We'll be in touch soon. 🙏");
    setForm({
      fullName: '',
      mobileNumber: '',
      emailAddress: '',
      subject: '',
      message: '',
    });
  };

  const contactCards = [
    {
      icon: MapPin,
      title: 'Ashram Address',
      content: (
        <>
          माँ वैष्णवी टूरिज़्म<br />
          Palaskhed Sapkal, Tehsil Chikhli<br />
          Taluka Chikhli<br />
          District Buldhana<br />
          Maharashtra – 443001
        </>
      ),
    },
    {
      icon: Phone,
      title: 'Phone',
      content: (
        <div className="space-y-1.5">
          <a href="tel:+919158740007" className="block hover:text-secondary transition-colors">+91 9158740007</a>
          <a href="tel:+919834151577" className="block hover:text-secondary transition-colors">+91 9834151577</a>
        </div>
      ),
    },
    {
      icon: Mail,
      title: 'Email',
      content: (
        <div className="space-y-1.5">
          <a href="mailto:info@shrigurudevashram.org" className="block hover:text-secondary transition-colors break-all">info@shrigurudevashram.org</a>
          <a href="mailto:info@shantiashramtrust.org" className="block hover:text-secondary transition-colors break-all">info@shantiashramtrust.org</a>
        </div>
      ),
    },
    {
      icon: Clock,
      title: 'Office Hours',
      content: (
        <div className="space-y-2">
          <p className="font-medium text-primary">Monday – Sunday</p>
          <div>
            <span className="text-xs uppercase tracking-wider text-secondary block font-semibold">Morning</span>
            <span>6:00 AM – 1:00 PM</span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-secondary block font-semibold">Evening</span>
            <span>4:00 PM – 8:30 PM</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 max-w-container-max mx-auto relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Side: Contact Information Cards (Col Span 6) */}
        <motion.div layout className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {contactCards.map((card, idx) => {
              const shouldRender = isDesktop || isExpanded || idx < 1;
              if (!shouldRender) return null;

              const IconComponent = card.icon;
              return (
                <motion.div
                  key={card.title}
                  layout
                  initial={!isDesktop && idx >= 1 ? { opacity: 0, y: 30 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: !isDesktop && idx >= 1 ? (idx - 1) * 0.1 : 0 
                  }}
                  className="rounded-2xl bg-surface-container-lowest p-6 md:p-8 border border-outline-variant/30 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-start group"
                >
                  {/* Elegant Icon with Saffron Accent */}
                  <div className="w-12 h-12 rounded-xl bg-[#C98B1A]/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-300 shadow-inner">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline-sm text-lg md:text-xl font-bold text-primary mb-3">
                    {card.title}
                  </h3>
                  <div className="font-body-md text-sm md:text-base text-on-surface-variant leading-relaxed font-light">
                    {card.content}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* View More Toggle for Mobile */}
          {!isDesktop && contactCards.length > 1 && (
            <motion.button
              layout
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 w-full flex items-center justify-center gap-2 py-4 border-y border-outline-variant/30 text-[#C98B1A] hover:bg-[#C98B1A]/5 active:bg-[#C98B1A]/10 transition-colors focus-ring min-h-[44px]"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  <span className="font-label-caps text-xs tracking-wider uppercase font-bold">Show Less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  <span className="font-label-caps text-xs tracking-wider uppercase font-bold">View More Details</span>
                </>
              )}
            </motion.button>
          )}
        </motion.div>

        {/* Right Side: Premium Floating Form Card (Col Span 6) */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl bg-surface-container-lowest p-8 md:p-12 border border-outline-variant/30 shadow-xl relative overflow-hidden">
            {/* Subtle top golden accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-80"></div>
            
            <h2 className="font-headline-sm text-2xl md:text-3xl font-bold text-primary mb-2">
              Send us a Message
            </h2>
            <p className="font-body-md text-sm md:text-base text-on-surface-variant mb-8 font-light">
              Have questions about Yatras or Ashram darshan? Reach out to us below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Your full name"
                    className="w-full px-5 py-3.5 rounded-xl bg-surface border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner text-sm md:text-base focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.mobileNumber}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-5 py-3.5 rounded-xl bg-surface border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner text-sm md:text-base focus-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.emailAddress}
                    onChange={(e) => setForm({ ...form, emailAddress: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-5 py-3.5 rounded-xl bg-surface border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner text-sm md:text-base focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Subject of inquiry"
                    className="w-full px-5 py-3.5 rounded-xl bg-surface border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner text-sm md:text-base focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-secondary mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can we assist your spiritual journey..."
                  className="w-full px-5 py-3.5 rounded-xl bg-surface border border-outline-variant/50 text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner text-sm md:text-base resize-none focus-ring"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" aria-hidden="true" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
