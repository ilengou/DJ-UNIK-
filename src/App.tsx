import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Calculator, 
  FileText, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Music, 
  Calendar, 
  MapPin, 
  User, 
  Mail, 
  Phone,
  LayoutDashboard,
  Plus,
  Download,
  ExternalLink,
  Search,
  Loader2,
  Lock,
  Image as ImageIcon,
  Trophy,
  ListMusic,
  Play,
  Trash2,
  RefreshCcw,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICES, EVENT_TYPES } from './constants';
import { Service, QuoteRequest } from './types';

// --- Components ---

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Details', 'Package', 'Add-ons', 'Review'];
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              currentStep >= index + 1 ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-2 text-xs uppercase tracking-widest font-semibold ${
              currentStep >= index + 1 ? 'text-zinc-200' : 'text-zinc-500'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-px ${currentStep > index + 1 ? 'bg-orange-600' : 'bg-zinc-800'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const QuoteForm = ({ onComplete }: { onComplete: (data: Partial<QuoteRequest>) => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<QuoteRequest>>({
    client_name: '',
    client_email: '',
    client_phone: '',
    event_type: EVENT_TYPES[0],
    event_date: '',
    venue: '',
    guest_count: 50,
    services: [],
    total_amount: 0
  });

  const updateFormData = (data: Partial<QuoteRequest>) => {
    setFormData(prev => {
      const updated = { ...prev, ...data };
      
      // Re-calculate package prices if guest_count or hours changed
      if (data.guest_count !== undefined || data.services !== undefined) {
        updated.services = updated.services?.map(s => {
          if (s.category === 'package') {
            const originalService = SERVICES.find(os => os.id === s.id);
            if (originalService) {
              let basePrice = originalService.price;
              
              // Special logic for Club / Radio Set (per hour, no guest surcharge)
              if (s.id === 'club-radio') {
                return { ...s, price: originalService.price * (s.hours || 1) };
              }

              const extraGuests = Math.max(0, updated.guest_count - 50);
              const extraCost = Math.ceil(extraGuests / 50) * 2000;
              return { ...s, price: originalService.price + extraCost };
            }
          }
          return s;
        });
      }

      const total = updated.services?.reduce((acc, s) => acc + s.price, 0) || 0;
      return { ...updated, total_amount: total };
    });
  };

  const toggleService = (service: Service) => {
    const isSelected = formData.services?.some(s => s.id === service.id);
    let newServices = [];

    // Calculate adjusted price for packages
    let adjustedService = { ...service };
    if (service.category === 'package') {
      if (service.id === 'club-radio') {
        adjustedService.price = service.price * (service.hours || 1);
      } else {
        const extraGuests = Math.max(0, (formData.guest_count || 50) - 50);
        const extraCost = Math.ceil(extraGuests / 50) * 2000;
        adjustedService.price = service.price + extraCost;
      }
    }

    if (isSelected) {
      newServices = formData.services?.filter(s => s.id !== service.id) || [];
    } else {
      // If it's a package, replace existing package
      if (service.category === 'package') {
        newServices = [adjustedService, ...(formData.services?.filter(s => s.category !== 'package') || [])];
      } else {
        newServices = [...(formData.services || []), adjustedService];
      }
    }
    updateFormData({ services: newServices });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="max-w-2xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
      <StepIndicator currentStep={step} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={e => updateFormData({ client_name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-orange-600 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={e => updateFormData({ client_email: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-orange-600 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    value={formData.client_phone}
                    onChange={e => updateFormData({ client_phone: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-orange-600 transition-colors"
                    placeholder="+27 82 123 4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={e => updateFormData({ event_type: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-orange-600 transition-colors appearance-none"
                >
                  {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Event Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={e => updateFormData({ event_date: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-orange-600 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Venue / Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={e => updateFormData({ venue: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-orange-600 transition-colors"
                    placeholder="Venue Name, City"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!formData.client_name || !formData.client_email || !formData.event_date || !formData.venue}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <span>Select Package</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center space-x-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    {formData.services?.some(s => s.category === 'package') ? 'Selected Package' : 'Select a Package'}
                  </h3>
                  {formData.services?.some(s => s.category === 'package') && (
                    <button 
                      onClick={() => updateFormData({ services: formData.services?.filter(s => s.category !== 'package') })}
                      className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>
                
                {/* Hide Guest Count for Club / Radio */}
                {!formData.services?.some(s => s.id === 'club-radio') && (
                  <div className="w-32 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Guest Count</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.guest_count}
                      onChange={e => updateFormData({ guest_count: parseInt(e.target.value) || 0 })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 px-3 text-sm text-zinc-200 focus:outline-none focus:border-orange-600 transition-colors"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {SERVICES.filter(s => {
                  const selectedPackage = formData.services?.find(p => p.category === 'package');
                  if (selectedPackage) {
                    return s.id === selectedPackage.id;
                  }
                  return s.category === 'package';
                }).map(service => {
                  const isClub = service.id === 'club-radio';
                  const extraGuests = isClub ? 0 : Math.max(0, (formData.guest_count || 50) - 50);
                  const extraCost = Math.ceil(extraGuests / 50) * 2000;
                  
                  // Handle hours for Club / Radio
                  const currentHours = formData.services?.find(s => s.id === service.id)?.hours || 1;
                  const basePrice = isClub ? service.price * currentHours : service.price;
                  const currentPrice = basePrice + extraCost;
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={service.id}
                      onClick={() => toggleService(isClub ? { ...service, hours: currentHours } : service)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        formData.services?.some(s => s.id === service.id)
                          ? 'bg-orange-600/10 border-orange-600'
                          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-200">{service.name}</h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            {service.description} 
                            {!isClub && ` (Optimized for ${formData.guest_count} guests)`}
                          </p>
                          
                          {isClub && (
                            <div className="mt-4 flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">Duration:</span>
                              <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-700 p-1">
                                <button 
                                  onClick={() => {
                                    const newHours = Math.max(1, currentHours - 1);
                                    if (formData.services?.some(s => s.id === service.id)) {
                                      updateFormData({ 
                                        services: formData.services.map(s => s.id === service.id ? { ...s, hours: newHours } : s) 
                                      });
                                    }
                                  }}
                                  className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white"
                                >-</button>
                                <span className="w-8 text-center text-xs font-bold text-zinc-200">{currentHours}h</span>
                                <button 
                                  onClick={() => {
                                    const newHours = currentHours + 1;
                                    if (formData.services?.some(s => s.id === service.id)) {
                                      updateFormData({ 
                                        services: formData.services.map(s => s.id === service.id ? { ...s, hours: newHours } : s) 
                                      });
                                    }
                                  }}
                                  className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white"
                                >+</button>
                              </div>
                              <span className="text-[10px] text-zinc-500 italic">R {service.price}/hr</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-orange-500">R {currentPrice.toLocaleString()}</span>
                          {extraCost > 0 && (
                            <p className="text-[10px] text-orange-500/60 font-bold">+ R {extraCost.toLocaleString()} sound</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={prevStep}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.services?.some(s => s.category === 'package')}
                className="flex-[2] bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <span>Add-ons</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em]">Add-ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SERVICES.filter(s => s.category === 'addon').map(service => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.services?.some(s => s.id === service.id)
                        ? 'bg-orange-600/10 border-orange-600'
                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-bold text-zinc-200 text-sm">{service.name}</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{service.description}</p>
                      </div>
                      <span className="text-sm font-bold text-orange-500 ml-4">R {service.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={prevStep}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={nextStep}
                className="flex-[2] bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <span>Review Quote</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700 space-y-4">
              <div className="flex justify-between border-b border-zinc-700 pb-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Client</h4>
                  <p className="text-zinc-200 font-medium">{formData.client_name}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Event Date</h4>
                  <p className="text-zinc-200 font-medium">{formData.event_date}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Selected Services</h4>
                {formData.services?.map(s => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span className="text-zinc-400">
                      {s.name} 
                      {s.category === 'package' && s.id !== 'club-radio' && ` (${formData.guest_count} guests)`}
                      {s.hours && ` - ${s.hours} hours`}
                    </span>
                    <span className="text-zinc-200 font-mono">R {s.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-700 flex justify-between items-center">
                <span className="text-lg font-bold text-zinc-200">Total Amount</span>
                <span className="text-2xl font-bold text-orange-500">R {formData.total_amount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={prevStep}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => onComplete(formData)}
                className="flex-[2] bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-orange-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Generate Quote</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuotePreview = ({ quote, onReset }: { quote: QuoteRequest, onReset: () => void }) => {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadPDF = async () => {
    if (!quoteRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(quoteRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`DJ-UNIK-Quote-${quote.id.toUpperCase()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div ref={quoteRef} className="bg-white text-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-zinc-900 p-12 text-white flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">DJ UNIK</h1>
            <p className="text-zinc-400 text-xs tracking-[0.3em] font-bold mt-2 uppercase">Professional DJ & Producer</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quote No.</p>
            <p className="text-lg font-mono font-bold text-orange-500">#{quote.id.toUpperCase()}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-12 space-y-12">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Client Information</h3>
              <div className="space-y-1">
                <p className="font-bold text-lg">{quote.client_name}</p>
                <p className="text-sm text-zinc-500">{quote.client_email}</p>
                <p className="text-sm text-zinc-500">{quote.client_phone}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Event Details</h3>
              <div className="space-y-1">
                <p className="font-bold">{quote.event_type}</p>
                <p className="text-sm text-zinc-500">{quote.event_date}</p>
                <p className="text-sm text-zinc-500">{quote.venue}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Services & Pricing</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {quote.services.map(service => (
                  <tr key={service.id}>
                    <td className="py-4">
                      <p className="font-bold text-zinc-800">
                        {service.name} 
                        {service.category === 'package' && service.id !== 'club-radio' && <span className="text-xs text-orange-600 ml-2">({quote.guest_count} guests)</span>}
                        {service.hours && <span className="text-xs text-zinc-400 ml-2">({service.hours} hours)</span>}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {service.category === 'package' 
                          ? `${service.description.split('(up to 50 guests)')[0]} (Optimized for ${quote.guest_count} guests)`
                          : service.description}
                      </p>
                    </td>
                    <td className="py-4 text-right font-mono font-bold text-zinc-700">
                      R {service.price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-6 text-right font-bold text-zinc-400 uppercase text-xs tracking-widest">Subtotal</td>
                  <td className="py-6 text-right font-mono font-bold text-zinc-800">R {quote.total_amount.toLocaleString()}</td>
                </tr>
                <tr className="border-t-2 border-zinc-900">
                  <td className="py-6 text-right font-black text-zinc-900 uppercase text-sm tracking-[0.2em]">Total Due</td>
                  <td className="py-6 text-right font-mono text-2xl font-black text-orange-600">R {quote.total_amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-zinc-50 p-8 rounded-2xl border border-zinc-100 space-y-4">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Payment Terms</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              A 50% deposit is required to confirm the booking. The remaining balance is due 7 days prior to the event. 
              Payments can be made via EFT or secure online payment. Quotes are valid for 14 days.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 p-12 border-t border-zinc-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Contact</p>
            <p className="text-xs font-bold text-zinc-700">enquiries@djunik.co.za</p>
            <p className="text-xs text-zinc-500">www.djunik.co.za</p>
          </div>
          <div className="flex space-x-4" data-html2canvas-ignore>
            <button 
              onClick={downloadPDF}
              disabled={isDownloading}
              className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <button 
          onClick={onReset}
          className="text-zinc-500 hover:text-zinc-300 text-sm font-bold uppercase tracking-widest transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quote</span>
        </button>
      </div>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-white">Admin Access</h2>
          <p className="text-zinc-500 text-sm">Please identify yourself to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-orange-600 transition-all"
              placeholder="Enter username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-orange-600 transition-all"
              placeholder="Enter password"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-600/20"
          >
            Login
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setShowForgotModal(true)}
            className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-orange-500 transition-colors"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForgotModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-white">Reset Password</h3>
                <p className="text-zinc-500 text-sm">Please contact the system administrator to reset your credentials.</p>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700">
                <p className="text-xs text-zinc-400 text-center">
                  Support Email:<br/>
                  <span className="text-orange-500 font-bold">support@djunik.co.za</span>
                </p>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Gallery = () => {
  const images = [
    { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800', title: 'Club Night' },
    { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800', title: 'Wedding Celebration' },
    { url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800', title: 'Corporate Event' },
    { url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=800', title: 'Outdoor Party' },
    { url: 'https://images.unsplash.com/photo-1514525253344-f81f3f74414f?auto=format&fit=crop&q=80&w=800', title: 'Concert Stage' },
    { url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800', title: 'Private Function' },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black tracking-tight text-white">Event Gallery</h2>
        <p className="text-zinc-500 max-w-xl mx-auto">
          Take a look at some of our recent events and setups. We bring the energy and the sound to every occasion.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group relative aspect-video rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900"
          >
            <img 
              src={img.url} 
              alt={img.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <h3 className="text-white font-bold text-lg">{img.title}</h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const MusicCharts = () => {
  const charts = [
    { rank: 1, title: 'Water', artist: 'Tyla', genre: 'Amapiano', trend: 'up' },
    { rank: 2, title: 'Mnike', artist: 'Tyler ICU', genre: 'Amapiano', trend: 'down' },
    { rank: 3, title: 'Imithandazo', artist: 'Kabza De Small', genre: 'Amapiano', trend: 'up' },
    { rank: 4, title: 'Hamba Juba', artist: 'Lady Amar', genre: 'Amapiano', trend: 'same' },
    { rank: 5, title: 'Awukhuzeki', artist: 'DJ Stokie', genre: 'Amapiano', trend: 'up' },
    { rank: 6, title: 'Sgudi Snyc', artist: 'De Mthuda', genre: 'Amapiano', trend: 'down' },
    { rank: 7, title: 'Nana', artist: 'Joshua Baraka', genre: 'Afrobeats', trend: 'up' },
    { rank: 8, title: 'City Boys', artist: 'Burna Boy', genre: 'Afrobeats', trend: 'same' },
  ];

  const previewOnAppleMusic = (title: string, artist: string) => {
    const query = encodeURIComponent(`${title} ${artist}`);
    window.open(`https://music.apple.com/search?term=${query}`, '_blank');
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black tracking-tight text-white">Shazam Charts</h2>
        <p className="text-zinc-500 max-w-xl mx-auto">
          The hottest tracks trending right now in South Africa. Stay ahead of the curve with DJ Unik's curated charts.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden max-w-4xl mx-auto">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-orange-500" />
            <span>Top Trending Tracks</span>
          </h3>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Updated Hourly</span>
        </div>
        <div className="divide-y divide-zinc-800">
          {charts.map((track) => (
            <div key={track.rank} className="flex items-center p-4 hover:bg-zinc-800/30 transition-colors group">
              <div className="w-12 text-center">
                <span className={`text-lg font-black ${track.rank <= 3 ? 'text-orange-500' : 'text-zinc-500'}`}>
                  {track.rank}
                </span>
              </div>
              <button 
                onClick={() => previewOnAppleMusic(track.title, track.artist)}
                className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mr-4 group-hover:bg-orange-600 transition-colors"
              >
                <Play className="w-4 h-4 text-zinc-400 group-hover:text-white" />
              </button>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-200">{track.title}</h4>
                <p className="text-xs text-zinc-500">{track.artist}</p>
              </div>
              <div className="hidden md:block px-6">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-zinc-800 px-2 py-1 rounded-md">
                  {track.genre}
                </span>
              </div>
              <div className="w-20 text-right flex items-center justify-end space-x-4">
                <div className="text-right">
                  {track.trend === 'up' && <span className="text-green-500 text-xs font-bold">▲</span>}
                  {track.trend === 'down' && <span className="text-red-500 text-xs font-bold">▼</span>}
                  {track.trend === 'same' && <span className="text-zinc-500 text-xs font-bold">●</span>}
                </div>
                <button 
                  onClick={() => previewOnAppleMusic(track.title, track.artist)}
                  className="p-2 text-zinc-600 hover:text-orange-500 transition-colors"
                  title="Preview on Apple Music"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PlaylistImporter = () => {
  const [playlist, setPlaylist] = useState<{id: string, title: string, artist: string}[]>([]);
  const [newSong, setNewSong] = useState({ title: '', artist: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<any[]>([]);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [appleMusicUrl, setAppleMusicUrl] = useState('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        setSpotifyToken(event.data.accessToken);
        fetchSpotifyPlaylists(event.data.accessToken);
      } else if (event.data?.type === 'SPOTIFY_AUTH_ERROR') {
        alert(`Spotify Connection Error: ${event.data.error}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchSpotifyPlaylists = async (token: string) => {
    setIsImporting(true);
    try {
      const res = await fetch('/api/spotify/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSpotifyPlaylists(data.items || []);
      setShowSpotifyModal(true);
    } catch (error) {
      console.error("Failed to fetch Spotify playlists:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const importSpotifyPlaylist = async (playlistId: string) => {
    if (!spotifyToken) return;
    setIsImporting(true);
    try {
      const res = await fetch(`/api/spotify/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${spotifyToken}` }
      });
      const data = await res.json();
      const tracks = data.items.map((item: any) => ({
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists[0].name
      }));
      setPlaylist([...playlist, ...tracks]);
      setShowSpotifyModal(false);
    } catch (error) {
      console.error("Failed to import tracks:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSpotifyConnect = async () => {
    try {
      const res = await fetch('/api/auth/spotify/url');
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Failed to connect to Spotify. Please check your configuration.");
        return;
      }
      
      window.open(data.url, 'spotify_auth', 'width=600,height=700');
    } catch (error) {
      console.error("Failed to get Spotify auth URL:", error);
      alert("Could not reach the server. Please try again later.");
    }
  };

  const handleAppleMusicImport = () => {
    if (!appleMusicUrl) return;
    // Simulate import for Apple Music since full API requires complex setup
    // In a real app, we'd use MusicKit JS or a backend scraper
    setIsImporting(true);
    setTimeout(() => {
      const mockTracks = [
        { id: 'am1', title: 'Simulated Apple Track 1', artist: 'Apple Artist' },
        { id: 'am2', title: 'Simulated Apple Track 2', artist: 'Apple Artist' },
      ];
      setPlaylist([...playlist, ...mockTracks]);
      setAppleMusicUrl('');
      setIsImporting(false);
    }, 1500);
  };

  const addSong = () => {
    if (newSong.title && newSong.artist) {
      setPlaylist([...playlist, { ...newSong, id: Math.random().toString(36).substr(2, 9) }]);
      setNewSong({ title: '', artist: '' });
    }
  };

  const removeSong = (id: string) => {
    setPlaylist(playlist.filter(s => s.id !== id));
  };

  const previewOnAppleMusic = (title: string, artist: string) => {
    const query = encodeURIComponent(`${title} ${artist}`);
    window.open(`https://music.apple.com/search?term=${query}`, '_blank');
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black tracking-tight text-white">Playlist Importer</h2>
        <p className="text-zinc-500 max-w-xl mx-auto">
          Planning an event? Import your existing playlists from Spotify or Apple Music, or build one manually.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Manual Add */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Add Manually</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Song Title</label>
                <input
                  type="text"
                  value={newSong.title}
                  onChange={e => setNewSong({ ...newSong, title: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-sm text-zinc-200 focus:outline-none focus:border-orange-600 transition-all"
                  placeholder="e.g. Water"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Artist</label>
                <input
                  type="text"
                  value={newSong.artist}
                  onChange={e => setNewSong({ ...newSong, artist: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-sm text-zinc-200 focus:outline-none focus:border-orange-600 transition-all"
                  placeholder="e.g. Tyla"
                />
              </div>
              <button
                onClick={addSong}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Track</span>
              </button>
            </div>
          </div>

          {/* Spotify Import */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Spotify Import</span>
            </h3>
            <p className="text-[10px] text-zinc-500">Connect your Spotify account to import your personal playlists directly.</p>
            <button
              onClick={handleSpotifyConnect}
              disabled={isImporting}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              <span>{spotifyToken ? 'Refresh Playlists' : 'Connect Spotify'}</span>
            </button>
          </div>

          {/* Apple Music Import */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              <span>Apple Music Import</span>
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                value={appleMusicUrl}
                onChange={e => setAppleMusicUrl(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-sm text-zinc-200 focus:outline-none focus:border-orange-600 transition-all"
                placeholder="Paste Playlist URL"
              />
              <button
                onClick={handleAppleMusicImport}
                disabled={isImporting || !appleMusicUrl}
                className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Import from URL</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-2">
                <ListMusic className="w-4 h-4 text-orange-500" />
                <span>Imported Playlist</span>
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{playlist.length} Tracks</span>
                {playlist.length > 0 && (
                  <button className="text-orange-500 hover:text-orange-400 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 divide-y divide-zinc-800">
              {playlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center opacity-50">
                    <Music className="w-10 h-10 text-zinc-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-zinc-300 font-bold">No tracks imported yet</p>
                    <p className="text-zinc-500 text-xs max-w-xs">Use the tools on the left to import your favorite music for your event.</p>
                  </div>
                </div>
              ) : (
                playlist.map((track, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={`${track.id}-${index}`}
                    className="flex items-center p-4 hover:bg-zinc-800/30 transition-colors group"
                  >
                    <div className="w-8 text-xs font-bold text-zinc-600">{index + 1}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-200 text-sm">{track.title}</h4>
                      <p className="text-[10px] text-zinc-500">{track.artist}</p>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => previewOnAppleMusic(track.title, track.artist)}
                        className="p-2 text-zinc-600 hover:text-orange-500 transition-colors"
                        title="Preview on Apple Music"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeSong(track.id)}
                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                        title="Remove from Playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spotify Playlist Selection Modal */}
      <AnimatePresence>
        {showSpotifyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-xl font-black text-white">Select Spotify Playlist</h3>
                <button onClick={() => setShowSpotifyModal(false)} className="text-zinc-500 hover:text-white">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {spotifyPlaylists.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => importSpotifyPlaylist(p.id)}
                    className="flex items-center p-3 bg-zinc-800/50 border border-zinc-700 rounded-2xl hover:bg-zinc-800 hover:border-green-500/50 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-700 mr-4">
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-full h-full p-3 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-200 text-sm truncate group-hover:text-green-500 transition-colors">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{p.tracks.total} Tracks</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
                <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest">Select a playlist to import all its tracks</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminDashboard = () => {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/quotes')
      .then(res => res.json())
      .then(data => {
        setQuotes(data);
        setLoading(false);
      });
  }, []);

  const filteredQuotes = quotes.filter(q => 
    q.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">Dashboard</h2>
          <p className="text-zinc-500 text-sm">Manage your quotes and bookings</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-orange-600 transition-colors w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Quotes</p>
          <p className="text-4xl font-black text-zinc-100 mt-2">{quotes.length}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Value</p>
          <p className="text-4xl font-black text-orange-500 mt-2">R {quotes.reduce((acc, q) => acc + q.total_amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pending</p>
          <p className="text-4xl font-black text-zinc-100 mt-2">{quotes.filter(q => q.status === 'pending').length}</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-900/80 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Event Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Loading quotes...</td></tr>
            ) : filteredQuotes.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No quotes found</td></tr>
            ) : filteredQuotes.map(quote => (
              <tr key={quote.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-zinc-400">#{quote.id}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-zinc-200 text-sm">{quote.client_name}</p>
                  <p className="text-[10px] text-zinc-500">{quote.client_email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400">{quote.event_date}</td>
                <td className="px-6 py-4 font-bold text-zinc-200">R {quote.total_amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    quote.status === 'pending' ? 'bg-zinc-800 text-zinc-400' : 'bg-green-900/30 text-green-500'
                  }`}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-500 hover:text-zinc-200">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'form' | 'preview' | 'admin' | 'gallery' | 'charts' | 'playlist'>('form');
  const [currentQuote, setCurrentQuote] = useState<QuoteRequest | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const handleQuoteComplete = async (data: Partial<QuoteRequest>) => {
    const quoteData = {
      ...data,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });
      
      const result = await res.json();
      
      if (res.ok && result.id) {
        const fullQuote: QuoteRequest = {
          ...quoteData as QuoteRequest,
          id: result.id
        };
        setCurrentQuote(fullQuote);
        setView('preview');
      }
    } catch (error) {
      console.error("Failed to save quote:", error);
      // Fallback for demo if server is down (though it shouldn't be)
      const fallbackId = `DEMO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const fullQuote: QuoteRequest = {
        ...quoteData as QuoteRequest,
        id: fallbackId
      };
      setCurrentQuote(fullQuote);
      setView('preview');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-orange-600 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('form')}>
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter italic">DJ UNIK</h1>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.3em] -mt-1">QuotePro SA</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl">
            <button
              onClick={() => setView('form')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${
                view === 'form' || view === 'preview' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Calculator className="w-3 h-3" />
              <span>Generator</span>
            </button>
            <button
              onClick={() => setView('gallery')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${
                view === 'gallery' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Gallery</span>
            </button>
            <button
              onClick={() => setView('charts')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${
                view === 'charts' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Trophy className="w-3 h-3" />
              <span>Charts</span>
            </button>
            <button
              onClick={() => setView('playlist')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${
                view === 'playlist' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ListMusic className="w-3 h-3" />
              <span>Importer</span>
            </button>
            <button
              onClick={() => setView('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${
                view === 'admin' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'form' && (
            <motion.div
              key="form-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-black tracking-tight text-white">Get a Professional Quote</h2>
                <p className="text-zinc-500 max-w-xl mx-auto">
                  Experience the sound of DJ Unik. Select your event details and services to receive an instant, 
                  itemized quote for your next big occasion.
                </p>
              </div>
              <QuoteForm onComplete={handleQuoteComplete} />
            </motion.div>
          )}

          {view === 'preview' && currentQuote && (
            <motion.div
              key="preview-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <QuotePreview quote={currentQuote} onReset={() => setView('form')} />
            </motion.div>
          )}

          {view === 'gallery' && (
            <motion.div
              key="gallery-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Gallery />
            </motion.div>
          )}

          {view === 'charts' && (
            <motion.div
              key="charts-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MusicCharts />
            </motion.div>
          )}

          {view === 'playlist' && (
            <motion.div
              key="playlist-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PlaylistImporter />
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {isAdminAuthenticated ? (
                <AdminDashboard />
              ) : (
                <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-800/20 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
