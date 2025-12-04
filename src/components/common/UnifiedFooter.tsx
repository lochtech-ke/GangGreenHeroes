import { Link } from 'react-router-dom';
import {
  TreePine,
  Leaf,
  ShoppingBag,
  Award,
  HelpCircle,
  Mail,
  MessageCircle,
  Shield,
  FileText,
  Cookie,
  Receipt,
  CheckCircle,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';

// ===== Type Definitions =====

interface FooterLink {
  label: string;
  path: string;
  icon: LucideIcon;
  external?: boolean;
}

interface SocialLink {
  label: string;
  url: string;
  icon: LucideIcon;
}

interface PilotForest {
  name: string;
  description: string;
}

interface Partner {
  name: string;
  url?: string;
}

interface UnifiedFooterProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

// ===== Component =====

export function UnifiedFooter({ className = '' }: UnifiedFooterProps) {
  const currentYear = new Date().getFullYear();

  // Platform navigation links
  const platformLinks: FooterLink[] = [
    { label: 'Initiatives', path: '/initiatives', icon: TreePine },
    { label: 'Tree Registry', path: '/trees', icon: Leaf },
    { label: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
    { label: 'NFT Badges', path: '/nft-badges', icon: Award },
  ];

  // Support links
  const supportLinks: FooterLink[] = [
    { label: 'Help Center', path: '/help', icon: HelpCircle },
    { label: 'Contact Us', path: '/contact', icon: Mail },
    { label: 'FAQs', path: '/faqs', icon: MessageCircle },
    { label: 'Privacy Policy', path: '/legal/privacy', icon: Shield },
  ];

  // Legal links
  const legalLinks: FooterLink[] = [
    { label: 'Terms of Service', path: '/legal/terms', icon: FileText },
    { label: 'Privacy Policy', path: '/legal/privacy', icon: Shield },
    { label: 'Cookie Policy', path: '/legal/cookies', icon: Cookie },
    { label: 'Tax Receipt Policy', path: '/legal/tax-receipts', icon: Receipt },
    { label: 'Acceptable Use', path: '/legal/acceptable-use', icon: CheckCircle },
  ];

  // Social media links
  const socialLinks: SocialLink[] = [
    {
      label: 'Twitter',
      url: 'https://twitter.com/ganggreen',
      icon: ExternalLink,
    },
    {
      label: 'Facebook',
      url: 'https://facebook.com/ganggreen',
      icon: ExternalLink,
    },
    {
      label: 'Instagram',
      url: 'https://instagram.com/ganggreen',
      icon: ExternalLink,
    },
    {
      label: 'LinkedIn',
      url: 'https://linkedin.com/company/ganggreen',
      icon: ExternalLink,
    },
  ];

  // Pilot forests
  const pilotForests: PilotForest[] = [
    {
      name: 'Kakamega Forest',
      description: 'Primary pilot site',
    },
    {
      name: 'Karura Forest',
      description: 'Urban conservation area',
    },
    {
      name: 'Mau Forest',
      description: 'Critical water tower ecosystem',
    },
  ];

  // Partners
  const partners: Partner[] = [
    { name: 'Green Belt Movement', url: 'https://greenbeltmovement.org' },
    { name: 'GSMA', url: 'https://gsma.com' },
    { name: 'Antugrow', url: 'https://antugrow.com' },
  ];

  return (
    <footer
      className={`relative bg-gradient-to-br from-gray-900 via-green-900/20 to-gray-900 text-white border-t border-white/10 ${className}`}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 glass-dark backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">#GG</span>
              </div>
              <h2 className="text-2xl font-bold text-gradient">#GangGreen</h2>
            </div>
            <p className="text-gray-300 mb-6 max-w-md text-sm">
              Catalyzing a carbon-negative Africa through technology-driven forest conservation,
              carbon credit markets, and community engagement.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Platform</h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="flex items-center gap-2 text-gray-300 hover:text-green-400 transition-colors group text-sm"
                    >
                      <Icon size={16} className="group-hover:scale-110 transition-transform" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="flex items-center gap-2 text-gray-300 hover:text-green-400 transition-colors group text-sm"
                    >
                      <Icon size={16} className="group-hover:scale-110 transition-transform" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Legal Links Section */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-green-400">Legal</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {legalLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 text-gray-300 hover:text-green-400 transition-colors group text-sm"
                  >
                    <Icon size={14} className="group-hover:scale-110 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Pilot Forests Section */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <h4 className="text-lg font-semibold mb-4 text-green-400">Pilot Forests</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pilotForests.map((forest) => (
              <div key={forest.name} className="text-sm">
                <p className="text-white font-medium">{forest.name}</p>
                <p className="text-gray-400">{forest.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Links */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <h3 className="text-lg font-semibold mb-4 text-center text-green-400">
            Connect With Us
          </h3>
          <div className="flex justify-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-3 rounded-full hover:bg-green-500/20 hover:scale-110 transition-all group"
                  aria-label={social.label}
                >
                  <Icon size={20} className="text-gray-300 group-hover:text-green-400" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Wangari Maathai Quote */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="glass-green rounded-xl p-6">
              <p className="text-lg md:text-xl text-white italic mb-3 leading-relaxed">
                "I will do the best I can."
              </p>
              <p className="text-sm text-gray-300">
                — Prof. Wangari Maathai, Nobel Peace Prize Laureate (2004)
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Founder of the Green Belt Movement • Planted over 51 million trees across Kenya
              </p>
            </div>
          </div>
        </div>

        {/* Partners & Recognition */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">In Partnership With</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
              {partners.map((partner, index) => (
                <span key={partner.name} className="flex items-center gap-1">
                  {partner.url ? (
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-400 transition-colors flex items-center gap-1"
                    >
                      {partner.name}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    partner.name
                  )}
                  {index < partners.length - 1 && <span className="ml-4">•</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 text-center">
          <div className="text-sm mb-4">
            <p className="mb-2 text-gray-300">
              <span className="text-white font-medium">Loch Tech Solutions</span>
            </p>
            <p className="text-gray-400">
              Email:{' '}
              <a
                href="mailto:info@ganggreen.africa"
                className="hover:text-green-400 transition-colors"
              >
                info@ganggreen.africa
              </a>
            </p>
          </div>
          <p className="text-gray-400 text-sm mb-2">
            &copy; {currentYear} Loch Tech Solutions. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2 mb-2">
            <TreePine size={16} className="text-green-500" />
            Honoring the legacy of Prof. Wangari Maathai - Nobel Peace Prize Laureate
          </p>
          <p className="text-gray-500 text-xs">Licensed under MIT License</p>
        </div>

        {/* Tax Deduction Notice */}
        <div className="mt-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
          <p className="text-sm text-green-300 text-center">
            <span className="font-semibold">🇰🇪 Kenyan Tax Relief:</span> Donations may be eligible
            for tax deductions under Section 15(2)(p) of the Income Tax Act.{' '}
            <Link
              to="/legal/tax-receipts"
              className="underline hover:text-white transition-colors"
            >
              Learn more
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
