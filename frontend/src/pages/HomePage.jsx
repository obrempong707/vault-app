import { Link } from 'react-router-dom';
import { 
  Shield, 
  Package, 
  Vault, 
  Globe, 
  Lock, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Truck,
  Eye
} from 'lucide-react';
import Card from '../components/UI/Card';

const HomePage = () => {
  const features = [
    {
      icon: Vault,
      title: 'Secure Vault Storage',
      description: 'State-of-the-art vaults in Zurich, London, Singapore, and Dubai with 24/7 armed security.'
    },
    {
      icon: Globe,
      title: 'Global Shipping',
      description: 'Insured international transport with real-time tracking across 150+ countries.'
    },
    {
      icon: Lock,
      title: 'Maximum Security',
      description: 'Military-grade encryption, biometric access, and comprehensive insurance coverage.'
    },
    {
      icon: TrendingUp,
      title: 'Asset Management',
      description: 'Track your portfolio value, storage duration, and request shipments instantly.'
    }
  ];

  const stats = [
    { value: '$2.5B+', label: 'Assets Under Custody' },
    { value: '150+', label: 'Countries Served' },
    { value: '99.99%', label: 'Delivery Success Rate' },
    { value: '24/7', label: 'Security Monitoring' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 opacity-40" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30 mb-6">
              <Shield className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-blue-300 text-sm font-medium">Trusted by Fortune 500 Companies</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Secure Vault Storage &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                Precious Metal Logistics
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              The world's most trusted platform for storing and shipping gold, diamonds, 
              and precious gemstones with military-grade security.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/tracking"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Package className="w-5 h-5 mr-2" />
                Track Shipment
              </Link>
              <Link
                to="/vault"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200"
              >
                <Vault className="w-5 h-5 mr-2" />
                View My Vault
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose VaultLogix?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Industry-leading security and logistics for your most valuable assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} hover className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Simple, secure, and transparent process from deposit to delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Vault,
                title: 'Deposit Assets',
                description: 'Securely deposit your gold, diamonds, or gemstones at any of our global vault locations.'
              },
              {
                step: '02',
                icon: Eye,
                title: 'Monitor & Manage',
                description: 'Track your portfolio value, view storage details, and manage your assets online.'
              },
              {
                step: '03',
                icon: Truck,
                title: 'Request Shipment',
                description: 'When ready, request insured international shipping with real-time tracking.'
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative">
                  <Card className="p-8 text-center h-full">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {item.step}
                    </div>
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-slate-600">
                      {item.description}
                    </p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Bank-Grade Security for Your Precious Assets
                </h2>
                <ul className="space-y-4">
                  {[
                    'Lloyd\'s of London comprehensive insurance',
                    'Biometric access and 24/7 armed security',
                    'Real-time GPS tracking on all shipments',
                    'Tamper-evident packaging and seals',
                    'Full audit trail and documentation'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-64 h-64 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Shield className="w-32 h-32 text-white" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Lock className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Ready to Secure Your Assets?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Join thousands of collectors and institutions who trust VaultLogix 
            with their most valuable possessions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/vault"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/tracking"
              className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl border border-slate-300 transition-all duration-200"
            >
              Track a Shipment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
