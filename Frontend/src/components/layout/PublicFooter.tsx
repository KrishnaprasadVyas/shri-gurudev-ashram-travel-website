import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Heart } from 'lucide-react'
import ashramLogo from '../../assets/ashramlogo.png'

export function PublicFooter() {
  return (
    <footer className="bg-[#0a0908] border-t border-amber-900/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex flex-col items-center text-center mb-3.5">
              <img
                src={ashramLogo}
                alt="Shri Gurudev Ashram Logo"
                loading="lazy"
                className="w-40 sm:w-48 md:w-56 lg:w-64 h-auto object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-105"
                style={{ filter: 'brightness(1.2) contrast(1.2)' }}
              />

              <span className="mt-2.5 font-display font-bold text-xl text-gradient-saffron">
                Shri Gurudev Ashram
              </span>
            </div>

            <p className="text-sm text-[#f2f0eb]/50 leading-relaxed text-center">
              For over two decades, we have been guiding devotees on sacred
              Yatras across India's holiest destinations, under the divine
              blessings of Shri Gurudev.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-[#f2f0eb]/80 mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>

            <ul className="space-y-2">
              {[
                { to: '/about', label: 'About Us' },
                { to: '/yatras', label: 'Upcoming Yatras' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/faq', label: 'FAQ' },
                { to: '/contact', label: 'Contact' },
                { to: '/signup', label: 'Register Now' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-[#f2f0eb]/50 hover:text-amber-400 transition-colors focus-ring rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[#f2f0eb]/80 mb-4 text-sm uppercase tracking-wider">
              Contact Us
            </h3>

            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-[#f2f0eb]/50">
                <MapPin className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>
                  Shri Gurudev Ashram, Nashik, Maharashtra 422003
                </span>
              </li>

              <li className="flex items-center gap-3 text-sm text-[#f2f0eb]/50">
                <Phone className="h-4 w-4 text-amber-400 flex-shrink-0" />

                <a
                  href="tel:+919876543210"
                  className="hover:text-amber-400 transition-colors focus-ring rounded"
                >
                  +91 98765 43210
                </a>
              </li>

              <li className="flex items-center gap-3 text-sm text-[#f2f0eb]/50">
                <Mail className="h-4 w-4 text-amber-400 flex-shrink-0" />

                <a
                  href="mailto:info@shrigurudevashram.in"
                  className="hover:text-amber-400 transition-colors focus-ring rounded"
                >
                  info@shrigurudevashram.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-4 border-t border-amber-900/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#f2f0eb]/30">
          <p>
            © {new Date().getFullYear()} Shri Gurudev Ashram. All rights
            reserved.
          </p>

          <p className="flex items-center gap-1">
            Made with{' '}
            <Heart className="h-3 w-3 text-amber-500 fill-current" /> for
            devotees
          </p>
        </div>
      </div>
    </footer>
  )
}
