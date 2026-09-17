import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Heart, 
  Baby, 
  FileText, 
  Menu, 
  X, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Instagram,
  MessageCircle,
  ChevronDown,
  Star,
  Users,
  Award
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, contactForm);
      toast.success(t('contact.success'));
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error(t('contact.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const testimonials = [
    {
      name: "Ana & Pedro",
      text: language === 'en' 
        ? "Dhyana was incredible throughout our entire journey. As Brazilians in Ireland, we felt so lost at first, but she helped us understand everything and feel confident about our birth."
        : "Dhyana foi incrível durante toda nossa jornada. Como brasileiros na Irlanda, nos sentíamos muito perdidos no início, mas ela nos ajudou a entender tudo e nos sentir confiantes sobre o parto.",
      location: "Dublin"
    },
    {
      name: "Juliana & Marcos",
      text: language === 'en'
        ? "The birth preparation course was exactly what we needed. Dhyana explained everything about the Irish system and helped us create a birth plan that respected our cultural preferences."
        : "O curso de preparação para o parto foi exatamente o que precisávamos. Dhyana explicou tudo sobre o sistema irlandês e nos ajudou a criar um plano de parto que respeitava nossas preferências culturais.",
      location: "Cork"
    },
    {
      name: "Fernanda & Lucas",
      text: language === 'en'
        ? "Having a Brazilian doula who speaks Portuguese and understands our culture made all the difference. Dhyana was our advocate and support system throughout the entire process."
        : "Ter uma doula brasileira que fala português e entende nossa cultura fez toda a diferença. Dhyana foi nossa defensora e sistema de apoio durante todo o processo.",
      location: "Galway"
    }
  ];

  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#E5D0CC]/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-[#A86A61]" />
              <span className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2A2A]">
                Dhyana Garey
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('about')} className="text-[#5C5552] hover:text-[#A86A61] link-hover font-medium">
                {t('nav.about')}
              </button>
              <button onClick={() => scrollToSection('services')} className="text-[#5C5552] hover:text-[#A86A61] link-hover font-medium">
                {t('nav.services')}
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-[#5C5552] hover:text-[#A86A61] link-hover font-medium">
                {t('nav.testimonials')}
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-[#5C5552] hover:text-[#A86A61] link-hover font-medium">
                {t('nav.contact')}
              </button>
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-[#5C5552] hover:text-[#A86A61]"
                data-testid="language-toggle"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'PT' : 'EN'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-[#2D2A2A]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#E5D0CC]/30 py-4 px-6">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollToSection('about')} className="text-left text-[#5C5552] hover:text-[#A86A61] font-medium py-2">
                {t('nav.about')}
              </button>
              <button onClick={() => scrollToSection('services')} className="text-left text-[#5C5552] hover:text-[#A86A61] font-medium py-2">
                {t('nav.services')}
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-left text-[#5C5552] hover:text-[#A86A61] font-medium py-2">
                {t('nav.testimonials')}
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-left text-[#5C5552] hover:text-[#A86A61] font-medium py-2">
                {t('nav.contact')}
              </button>
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-[#5C5552] hover:text-[#A86A61] py-2"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'Português' : 'English'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient min-h-screen flex items-center pt-20" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2D2A2A] leading-tight mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-[#5C5552] mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => scrollToSection('contact')}
                className="btn-primary"
                data-testid="hero-cta-btn"
              >
                {t('hero.cta')}
              </Button>
              <Button 
                onClick={() => scrollToSection('services')}
                variant="outline"
                className="btn-outline"
              >
                {t('hero.learnMore')}
              </Button>
            </div>
          </div>
          <div className="animate-fade-in delay-200 relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#E5D0CC] rounded-full opacity-50"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#D4Beb9] rounded-full opacity-30"></div>
            <img 
              src="https://images.unsplash.com/photo-1757822757693-0efda118e1ed?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHw0fHxwcmVnbmFudCUyMGNvdXBsZSUyMG91dGRvb3JzJTIwc3Vuc2V0JTIwd2FybSUyMGxpZ2h0fGVufDB8fHx8MTc3MzQ0NTQ3N3ww&ixlib=rb-4.1.0&q=85"
              alt="Couple expecting baby"
              className="rounded-2xl shadow-lg relative z-10 w-full object-cover max-h-[500px]"
            />
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce hidden md:block">
          <ChevronDown className="w-8 h-8 text-[#A86A61]" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-padding bg-white" data-testid="about-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative animate-slide-in-left">
              <div className="absolute -top-4 -right-4 w-full h-full bg-[#E5D0CC] rounded-2xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1613275139344-0018ad151c09?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwyfHxicmF6aWxpYW4lMjB3b21hbiUyMHNtaWxpbmclMjBwb3J0cmFpdCUyMG5hdHVyYWwlMjBsaWdodHxlbnwwfHx8fDE3NzM0NDU0Njh8MA&ixlib=rb-4.1.0&q=85"
                alt="Doula Dhyana Garey"
                className="rounded-2xl relative z-10 w-full object-cover max-h-[500px]"
              />
            </div>
            <div className="animate-slide-in-right">
              <span className="text-[#A86A61] font-medium uppercase tracking-wider text-sm">
                {t('about.subtitle')}
              </span>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#2D2A2A] mt-2 mb-6">
                {t('about.title')}
              </h2>
              <p className="text-[#5C5552] leading-relaxed mb-8">
                {t('about.description')}
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <Award className="w-8 h-8 text-[#A86A61] mx-auto mb-2" />
                  <div className="font-['Playfair_Display'] text-3xl font-bold text-[#2D2A2A]">5+</div>
                  <div className="text-sm text-[#8A817C]">{t('about.experience')}</div>
                </div>
                <div className="text-center">
                  <Users className="w-8 h-8 text-[#A86A61] mx-auto mb-2" />
                  <div className="font-['Playfair_Display'] text-3xl font-bold text-[#2D2A2A]">100+</div>
                  <div className="text-sm text-[#8A817C]">{t('about.families')}</div>
                </div>
                <div className="text-center">
                  <Star className="w-8 h-8 text-[#A86A61] mx-auto mb-2" />
                  <div className="font-['Playfair_Display'] text-3xl font-bold text-[#2D2A2A]">98%</div>
                  <div className="text-sm text-[#8A817C]">{t('about.satisfaction')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section-padding bg-[#F5F2F0]" data-testid="services-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#A86A61] font-medium uppercase tracking-wider text-sm">
              {t('services.subtitle')}
            </span>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#2D2A2A] mt-2">
              {t('services.title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-service group animate-fade-in-up">
              <div className="w-14 h-14 bg-[#E5D0CC] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#A86A61] transition-colors duration-300">
                <Heart className="w-7 h-7 text-[#A86A61] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2A2A] mb-4">
                {t('services.preparation.title')}
              </h3>
              <p className="text-[#5C5552]">
                {t('services.preparation.description')}
              </p>
            </div>
            <div className="card-service group animate-fade-in-up delay-100">
              <div className="w-14 h-14 bg-[#E5D0CC] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#A86A61] transition-colors duration-300">
                <Baby className="w-7 h-7 text-[#A86A61] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2A2A] mb-4">
                {t('services.doula.title')}
              </h3>
              <p className="text-[#5C5552]">
                {t('services.doula.description')}
              </p>
            </div>
            <div className="card-service group animate-fade-in-up delay-200">
              <div className="w-14 h-14 bg-[#E5D0CC] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#A86A61] transition-colors duration-300">
                <FileText className="w-7 h-7 text-[#A86A61] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2A2A] mb-4">
                {t('services.birthPlan.title')}
              </h3>
              <p className="text-[#5C5552] mb-4">
                {t('services.birthPlan.description')}
              </p>
              <Button 
                onClick={() => navigate('/birth-plan')}
                variant="outline"
                className="btn-outline text-sm"
                data-testid="birth-plan-btn"
              >
                {t('nav.birthPlan')} →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="section-padding bg-white" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#A86A61] font-medium uppercase tracking-wider text-sm">
              {t('testimonials.subtitle')}
            </span>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#2D2A2A] mt-2">
              {t('testimonials.title')}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="card-testimonial animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#A86A61] text-[#A86A61]" />
                  ))}
                </div>
                <p className="text-[#5C5552] mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3 not-italic">
                  <div className="w-10 h-10 bg-[#E5D0CC] rounded-full flex items-center justify-center">
                    <span className="text-[#A86A61] font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-[#2D2A2A]">{testimonial.name}</div>
                    <div className="text-sm text-[#8A817C]">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-padding bg-[#F5F2F0]" data-testid="contact-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <span className="text-[#A86A61] font-medium uppercase tracking-wider text-sm">
                {t('contact.subtitle')}
              </span>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-bold text-[#2D2A2A] mt-2 mb-6">
                {t('contact.title')}
              </h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E5D0CC] rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#A86A61]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#8A817C]">Email</div>
                    <div className="text-[#2D2A2A]">contact@dhyanagarey.ie</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E5D0CC] rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#A86A61]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#8A817C]">Phone</div>
                    <div className="text-[#2D2A2A]">+353 XX XXX XXXX</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E5D0CC] rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#A86A61]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#8A817C]">Location</div>
                    <div className="text-[#2D2A2A]">Dublin, Ireland</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <a 
                  href="#" 
                  className="w-12 h-12 bg-[#E5D0CC] rounded-full flex items-center justify-center hover:bg-[#A86A61] group transition-colors duration-300"
                  data-testid="instagram-link"
                >
                  <Instagram className="w-5 h-5 text-[#A86A61] group-hover:text-white transition-colors duration-300" />
                </a>
                <a 
                  href="#" 
                  className="w-12 h-12 bg-[#E5D0CC] rounded-full flex items-center justify-center hover:bg-[#A86A61] group transition-colors duration-300"
                  data-testid="whatsapp-link"
                >
                  <MessageCircle className="w-5 h-5 text-[#A86A61] group-hover:text-white transition-colors duration-300" />
                </a>
              </div>
            </div>
            <div>
              <form onSubmit={handleContactSubmit} className="bg-white p-8 rounded-2xl shadow-sm" data-testid="contact-form">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2D2A2A] mb-2">
                      {t('contact.name')}
                    </label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      required
                      className="border-[#E5D0CC] focus:border-[#A86A61] focus:ring-[#A86A61]/30"
                      data-testid="contact-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2A2A] mb-2">
                      {t('contact.email')}
                    </label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      required
                      className="border-[#E5D0CC] focus:border-[#A86A61] focus:ring-[#A86A61]/30"
                      data-testid="contact-email-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2A2A] mb-2">
                      {t('contact.phone')}
                    </label>
                    <Input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      className="border-[#E5D0CC] focus:border-[#A86A61] focus:ring-[#A86A61]/30"
                      data-testid="contact-phone-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2A2A] mb-2">
                      {t('contact.message')}
                    </label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      required
                      rows={4}
                      className="border-[#E5D0CC] focus:border-[#A86A61] focus:ring-[#A86A61]/30"
                      data-testid="contact-message-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="btn-primary w-full"
                    disabled={submitting}
                    data-testid="contact-submit-btn"
                  >
                    {submitting ? t('common.loading') : t('contact.send')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2D2A2A] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-[#E5D0CC]" />
              <span className="font-['Playfair_Display'] text-lg">Doula Dhyana Garey</span>
            </div>
            <div className="text-[#8A817C] text-sm">
              © 2025 Doula Dhyana Garey. All rights reserved.
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/admin')}
                className="text-[#8A817C] hover:text-white text-sm"
                data-testid="admin-link"
              >
                {t('nav.admin')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
