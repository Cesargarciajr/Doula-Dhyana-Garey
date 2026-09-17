import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      about: 'About',
      services: 'Services',
      testimonials: 'Testimonials',
      contact: 'Contact',
      birthPlan: 'Birth Plan',
      admin: 'Admin'
    },
    // Hero
    hero: {
      title: 'Your Journey to Motherhood, Guided with Care',
      subtitle: 'Bridging cultures, aligning expectations. Supporting Brazilian families in Ireland through pregnancy, birth, and beyond.',
      cta: 'Get Started',
      learnMore: 'Learn More'
    },
    // About
    about: {
      title: 'About Dhyana',
      subtitle: 'Your Doula in Ireland',
      description: 'As a Brazilian doula living in Ireland, I understand the unique challenges that Brazilian families face when navigating a different healthcare system. My mission is to bridge the cultural gap and help you feel confident and supported throughout your pregnancy and birth journey.',
      experience: 'Years of Experience',
      families: 'Families Supported',
      satisfaction: 'Satisfaction Rate'
    },
    // Services
    services: {
      title: 'Services',
      subtitle: 'Comprehensive support for your journey',
      preparation: {
        title: 'Birth Preparation Course',
        description: 'A comprehensive course designed specifically for Brazilian couples in Ireland, covering the Irish healthcare system, cultural differences, and birth preparation.'
      },
      doula: {
        title: 'Doula Support',
        description: 'Continuous emotional and physical support during pregnancy, labor, and postpartum. Available in Portuguese and English.'
      },
      birthPlan: {
        title: 'Birth Plan Generator',
        description: 'Create your personalized birth plan with our interactive tool, available in both Portuguese and English.'
      }
    },
    // Testimonials
    testimonials: {
      title: 'What Families Say',
      subtitle: 'Real stories from real families'
    },
    // Contact
    contact: {
      title: 'Get in Touch',
      subtitle: 'I would love to hear from you',
      name: 'Name',
      email: 'Email',
      phone: 'Phone (optional)',
      message: 'Message',
      send: 'Send Message',
      success: 'Message sent successfully!',
      error: 'Error sending message. Please try again.'
    },
    // Birth Plan
    birthPlan: {
      title: 'Birth Plan Generator',
      subtitle: 'Create your personalized birth plan',
      enterToken: 'Enter your access token',
      tokenPlaceholder: 'Paste your token here',
      validate: 'Validate Token',
      invalidToken: 'Invalid or expired token',
      usedToken: 'This token has already been used',
      welcome: 'Welcome',
      progress: 'Progress',
      complete: 'Complete',
      review: 'Review Your Birth Plan',
      finish: 'Finish & Download',
      selectOptions: 'Select your preferences in each category',
      noOptions: 'No options in this category yet',
      selectedOptions: 'Selected Options',
      noSelections: 'No options selected yet',
      downloadPDF: 'Download PDF',
      planComplete: 'Birth Plan Complete!',
      thankYou: 'Thank you for completing your birth plan. You can download it as a PDF.',
      category: 'Category'
    },
    // Admin
    admin: {
      dashboard: 'Dashboard',
      categories: 'Categories',
      options: 'Options',
      tokens: 'Access Tokens',
      birthPlans: 'Birth Plans',
      contacts: 'Contact Submissions',
      login: 'Admin Login',
      logout: 'Logout',
      add: 'Add New',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      actions: 'Actions',
      seedData: 'Seed Initial Data',
      seeded: 'Data seeded successfully',
      generateToken: 'Generate Token',
      coupleName: 'Couple Name',
      token: 'Token',
      status: 'Status',
      used: 'Used',
      unused: 'Available',
      expired: 'Expired',
      createdAt: 'Created At',
      copyToken: 'Copy Token',
      copied: 'Copied!',
      nameEn: 'Name (English)',
      namePt: 'Name (Portuguese)',
      descriptionEn: 'Description (English)',
      descriptionPt: 'Description (Portuguese)',
      order: 'Order',
      active: 'Active',
      inactive: 'Inactive',
      confirmDelete: 'Are you sure you want to delete this item?'
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      yes: 'Yes',
      no: 'No'
    }
  },
  pt: {
    // Navigation
    nav: {
      home: 'Início',
      about: 'Sobre',
      services: 'Serviços',
      testimonials: 'Depoimentos',
      contact: 'Contato',
      birthPlan: 'Plano de Parto',
      admin: 'Admin'
    },
    // Hero
    hero: {
      title: 'Sua Jornada para a Maternidade, Guiada com Carinho',
      subtitle: 'Conectando culturas, alinhando expectativas. Apoiando famílias brasileiras na Irlanda durante a gravidez, parto e além.',
      cta: 'Começar',
      learnMore: 'Saiba Mais'
    },
    // About
    about: {
      title: 'Sobre Dhyana',
      subtitle: 'Sua Doula na Irlanda',
      description: 'Como doula brasileira vivendo na Irlanda, eu entendo os desafios únicos que famílias brasileiras enfrentam ao navegar um sistema de saúde diferente. Minha missão é conectar as diferenças culturais e ajudá-la a se sentir confiante e apoiada durante toda a sua jornada de gravidez e parto.',
      experience: 'Anos de Experiência',
      families: 'Famílias Apoiadas',
      satisfaction: 'Taxa de Satisfação'
    },
    // Services
    services: {
      title: 'Serviços',
      subtitle: 'Suporte completo para sua jornada',
      preparation: {
        title: 'Curso de Preparação para o Parto',
        description: 'Um curso abrangente projetado especificamente para casais brasileiros na Irlanda, cobrindo o sistema de saúde irlandês, diferenças culturais e preparação para o parto.'
      },
      doula: {
        title: 'Suporte de Doula',
        description: 'Apoio emocional e físico contínuo durante a gravidez, trabalho de parto e pós-parto. Disponível em português e inglês.'
      },
      birthPlan: {
        title: 'Gerador de Plano de Parto',
        description: 'Crie seu plano de parto personalizado com nossa ferramenta interativa, disponível em português e inglês.'
      }
    },
    // Testimonials
    testimonials: {
      title: 'O Que as Famílias Dizem',
      subtitle: 'Histórias reais de famílias reais'
    },
    // Contact
    contact: {
      title: 'Entre em Contato',
      subtitle: 'Adoraria ouvir de você',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone (opcional)',
      message: 'Mensagem',
      send: 'Enviar Mensagem',
      success: 'Mensagem enviada com sucesso!',
      error: 'Erro ao enviar mensagem. Por favor, tente novamente.'
    },
    // Birth Plan
    birthPlan: {
      title: 'Gerador de Plano de Parto',
      subtitle: 'Crie seu plano de parto personalizado',
      enterToken: 'Digite seu token de acesso',
      tokenPlaceholder: 'Cole seu token aqui',
      validate: 'Validar Token',
      invalidToken: 'Token inválido ou expirado',
      usedToken: 'Este token já foi usado',
      welcome: 'Bem-vindo(a)',
      progress: 'Progresso',
      complete: 'Completo',
      review: 'Revise Seu Plano de Parto',
      finish: 'Finalizar e Baixar',
      selectOptions: 'Selecione suas preferências em cada categoria',
      noOptions: 'Nenhuma opção nesta categoria ainda',
      selectedOptions: 'Opções Selecionadas',
      noSelections: 'Nenhuma opção selecionada ainda',
      downloadPDF: 'Baixar PDF',
      planComplete: 'Plano de Parto Completo!',
      thankYou: 'Obrigada por completar seu plano de parto. Você pode baixá-lo em PDF.',
      category: 'Categoria'
    },
    // Admin
    admin: {
      dashboard: 'Painel',
      categories: 'Categorias',
      options: 'Opções',
      tokens: 'Tokens de Acesso',
      birthPlans: 'Planos de Parto',
      contacts: 'Mensagens de Contato',
      login: 'Login Admin',
      logout: 'Sair',
      add: 'Adicionar',
      edit: 'Editar',
      delete: 'Excluir',
      save: 'Salvar',
      cancel: 'Cancelar',
      actions: 'Ações',
      seedData: 'Inserir Dados Iniciais',
      seeded: 'Dados inseridos com sucesso',
      generateToken: 'Gerar Token',
      coupleName: 'Nome do Casal',
      token: 'Token',
      status: 'Status',
      used: 'Usado',
      unused: 'Disponível',
      expired: 'Expirado',
      createdAt: 'Criado em',
      copyToken: 'Copiar Token',
      copied: 'Copiado!',
      nameEn: 'Nome (Inglês)',
      namePt: 'Nome (Português)',
      descriptionEn: 'Descrição (Inglês)',
      descriptionPt: 'Descrição (Português)',
      order: 'Ordem',
      active: 'Ativo',
      inactive: 'Inativo',
      confirmDelete: 'Tem certeza que deseja excluir este item?'
    },
    // Common
    common: {
      loading: 'Carregando...',
      error: 'Ocorreu um erro',
      retry: 'Tentar novamente',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      close: 'Fechar',
      yes: 'Sim',
      no: 'Não'
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'pt' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
