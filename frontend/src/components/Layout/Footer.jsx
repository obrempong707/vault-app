import { Shield, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">VaultLogix</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Premium secure vault storage and international shipping for gold, diamonds, 
              and precious gemstones. Trusted by collectors and institutions worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/tracking" className="text-sm hover:text-white transition-colors">
                  Track Shipment
                </Link>
              </li>
              <li>
                <Link to="/vault" className="text-sm hover:text-white transition-colors">
                  My Vault
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-sm hover:text-white transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>support@vaultlogix.com</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>+1 (800) 555-VAULT</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Zurich, Switzerland</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">
            © 2024 VaultLogix. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
