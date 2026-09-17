import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  Heart, 
  LayoutDashboard, 
  FolderTree, 
  ListChecks, 
  Key, 
  FileText, 
  Mail,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Database,
  Globe,
  Menu,
  X,
  CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Axios instance with credentials
const api = axios.create({
  baseURL: API,
  withCredentials: true
});

// Admin Login Form Component
function AdminLoginForm({ onLogin }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      onLogin(response.data);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#E5D0CC]/30 flex items-center justify-center p-6" data-testid="admin-login-page">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#E5D0CC] rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-[#A86A61]" />
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#2D2A2A] mb-2">
            {t('admin.login')}
          </h1>
          <p className="text-[#5C5552]">Sign in to manage your doula services</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[#2D2A2A] mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dhyanagarey.ie"
              required
              className="border-[#E5D0CC]"
              data-testid="admin-email-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#2D2A2A] mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border-[#E5D0CC]"
              data-testid="admin-password-input"
            />
          </div>
          
          <Button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
            data-testid="admin-login-btn"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-[#5C5552]"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    if (location.state?.user) {
      setLocalUser(location.state.user);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2F0]">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentUser = user || localUser;

  if (!currentUser) {
    return <AdminLoginForm onLogin={(userData) => {
      setLocalUser(userData);
      navigate('/admin', { state: { user: userData }, replace: true });
    }} />;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: t('admin.dashboard'), path: '/admin' },
    { icon: FolderTree, label: t('admin.categories'), path: '/admin/categories' },
    { icon: ListChecks, label: t('admin.options'), path: '/admin/options' },
    { icon: Key, label: t('admin.tokens'), path: '/admin/tokens' },
    { icon: FileText, label: t('admin.birthPlans'), path: '/admin/birth-plans' },
    { icon: Mail, label: 'Email Templates', path: '/admin/emails' },
    { icon: Mail, label: t('admin.contacts'), path: '/admin/contacts' },
  ];

  const handleLogout = async () => {
    await logout();
    setLocalUser(null);
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]" data-testid="admin-dashboard">
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#F5F2F0] p-6 z-40 transform transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center gap-2 mb-8">
          <Heart className="w-8 h-8 text-[#A86A61]" />
          <span className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2A2A]">
            Admin
          </span>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#E5D0CC] text-[#2D2A2A]' 
                    : 'text-[#5C5552] hover:bg-[#F5F2F0]'
                }`}
                data-testid={`nav-${item.path.split('/').pop() || 'dashboard'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-3 mb-4 p-3 bg-[#F5F2F0] rounded-lg">
            <div className="w-8 h-8 bg-[#E5D0CC] rounded-full flex items-center justify-center">
              <span className="text-[#A86A61] font-semibold">{currentUser?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-[#2D2A2A] truncate">{currentUser?.name}</div>
              <div className="text-xs text-[#8A817C] truncate">{currentUser?.email}</div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={toggleLanguage}
              className="flex-1 flex items-center justify-center gap-2 p-2 text-[#5C5552] hover:text-[#A86A61] border border-[#E5D0CC] rounded-lg"
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'PT' : 'EN'}
            </button>
            <button 
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 p-2 text-[#5C5552] hover:text-[#A86A61] border border-[#E5D0CC] rounded-lg"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="md:ml-64 p-8 min-h-screen">
        <Routes>
          <Route index element={<DashboardView />} />
          <Route path="categories" element={<CategoriesView />} />
          <Route path="options" element={<OptionsView />} />
          <Route path="tokens" element={<TokensView />} />
          <Route path="birth-plans" element={<BirthPlansView />} />
          <Route path="emails" element={<EmailTemplatesView />} />
          <Route path="contacts" element={<ContactsView />} />
        </Routes>
      </main>
    </div>
  );
}

// Dashboard View
function DashboardView() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    categories: 0,
    options: 0,
    tokens: 0,
    birthPlans: 0,
    pendingPlans: 0,
    contacts: 0
  });
  const [pendingPlans, setPendingPlans] = useState([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadStats();
    loadPendingPlans();
  }, []);

  const loadStats = async () => {
    try {
      const [categories, options, tokens, birthPlans, contacts] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/options'),
        api.get('/admin/tokens'),
        api.get('/admin/birth-plans'),
        api.get('/admin/contacts')
      ]);
      const pending = birthPlans.data.filter(p => p.status === 'pending_review');
      setStats({
        categories: categories.data.length,
        options: options.data.length,
        tokens: tokens.data.length,
        birthPlans: birthPlans.data.length,
        pendingPlans: pending.length,
        contacts: contacts.data.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPendingPlans = async () => {
    try {
      const response = await api.get('/admin/birth-plans/pending');
      setPendingPlans(response.data);
    } catch (error) {
      console.error('Error loading pending plans:', error);
    }
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      await api.post('/admin/seed');
      toast.success(t('admin.seeded'));
      loadStats();
    } catch (error) {
      if (error.response?.data?.message === 'Data already seeded') {
        toast.info('Data already exists');
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setSeeding(false);
    }
  };

  const approvePlan = async (planId) => {
    try {
      await api.post(`/admin/birth-plan/${planId}/approve`);
      toast.success('Birth plan approved!');
      loadPendingPlans();
      loadStats();
    } catch (error) {
      toast.error('Error approving plan');
    }
  };

  return (
    <div data-testid="dashboard-view">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D2A2A]">
          {t('admin.dashboard')}
        </h1>
        <Button
          onClick={seedData}
          disabled={seeding}
          variant="outline"
          className="btn-outline"
          data-testid="seed-data-btn"
        >
          <Database className="w-4 h-4 mr-2" />
          {seeding ? t('common.loading') : t('admin.seedData')}
        </Button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: t('admin.categories'), value: stats.categories, icon: FolderTree },
          { label: t('admin.options'), value: stats.options, icon: ListChecks },
          { label: t('admin.tokens'), value: stats.tokens, icon: Key },
          { label: t('admin.birthPlans'), value: stats.birthPlans, icon: FileText },
          { label: language === 'en' ? 'Pending' : 'Pendentes', value: stats.pendingPlans, icon: Clock, highlight: true },
          { label: t('admin.contacts'), value: stats.contacts, icon: Mail },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white p-4 rounded-xl shadow-sm ${stat.highlight && stats.pendingPlans > 0 ? 'border-2 border-[#E8B9AB]' : ''}`}>
            <stat.icon className={`w-6 h-6 ${stat.highlight && stats.pendingPlans > 0 ? 'text-[#E8B9AB]' : 'text-[#A86A61]'} mb-2`} />
            <div className="font-['Playfair_Display'] text-2xl font-bold text-[#2D2A2A]">
              {stat.value}
            </div>
            <div className="text-xs text-[#8A817C]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Birth Plans */}
      {pendingPlans.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[#E8B9AB]" />
            <h2 className="font-semibold text-[#2D2A2A]">
              {language === 'en' ? 'Pending Review' : 'Aguardando Revisão'}
            </h2>
          </div>
          <div className="space-y-3">
            {pendingPlans.map((plan) => (
              <div key={plan.plan_id} className="flex items-center justify-between p-4 bg-[#F5F2F0] rounded-lg">
                <div>
                  <div className="font-medium text-[#2D2A2A]">{plan.couple_name}</div>
                  <div className="text-sm text-[#8A817C]">
                    {plan.selected_options?.length || 0} {language === 'en' ? 'options selected' : 'opções selecionadas'}
                  </div>
                </div>
                <Button
                  onClick={() => approvePlan(plan.plan_id)}
                  className="btn-primary text-sm"
                  data-testid={`approve-${plan.plan_id}`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {language === 'en' ? 'Approve' : 'Aprovar'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Categories View
function CategoriesView() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name_en: '', name_pt: '', description_en: '', description_pt: '', order: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async () => {
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.category_id}`, formData);
      } else {
        await api.post('/admin/categories', formData);
      }
      toast.success('Saved!');
      loadCategories();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await api.delete(`/admin/categories/${categoryId}`);
      toast.success('Deleted!');
      loadCategories();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name_en: category.name_en,
      name_pt: category.name_pt,
      description_en: category.description_en || '',
      description_pt: category.description_pt || '',
      order: category.order
    });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingCategory(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name_en: '', name_pt: '', description_en: '', description_pt: '', order: 0 });
    setEditingCategory(null);
  };

  if (loading) return <div className="spinner mx-auto"></div>;

  return (
    <div data-testid="categories-view">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D2A2A]">
          {t('admin.categories')}
        </h1>
        <Button onClick={openAdd} className="btn-primary" data-testid="add-category-btn">
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.add')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('admin.edit') : t('admin.add')} Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('admin.nameEn')}</label>
                <Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">{t('admin.namePt')}</label>
                <Input value={formData.name_pt} onChange={(e) => setFormData({...formData, name_pt: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t('admin.descriptionEn')}</label>
              <Textarea value={formData.description_en} onChange={(e) => setFormData({...formData, description_en: e.target.value})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">{t('admin.descriptionPt')}</label>
              <Textarea value={formData.description_pt} onChange={(e) => setFormData({...formData, description_pt: e.target.value})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">{t('admin.order')}</label>
              <Input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})} className="mt-1 w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveCategory} className="btn-primary">{t('admin.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.order')}</TableHead>
              <TableHead>{language === 'en' ? 'Name' : 'Nome'}</TableHead>
              <TableHead>{t('admin.status')}</TableHead>
              <TableHead>{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.category_id}>
                <TableCell>{category.order}</TableCell>
                <TableCell className="font-medium">{language === 'en' ? category.name_en : category.name_pt}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {category.is_active ? t('admin.active') : t('admin.inactive')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(category)} className="p-2 text-[#5C5552] hover:text-[#A86A61]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteCategory(category.category_id)} className="p-2 text-[#5C5552] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Options View
function OptionsView() {
  const { t, language } = useLanguage();
  const [options, setOptions] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    category_id: '', name_en: '', name_pt: '', description_en: '', description_pt: '', order: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategoryFilter === 'all') {
      setFilteredOptions(options);
    } else {
      setFilteredOptions(options.filter(opt => opt.category_id === selectedCategoryFilter));
    }
  }, [selectedCategoryFilter, options]);

  const loadData = async () => {
    try {
      const [optionsRes, categoriesRes] = await Promise.all([
        api.get('/admin/options'),
        api.get('/admin/categories')
      ]);
      setOptions(optionsRes.data);
      setFilteredOptions(optionsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const saveOption = async () => {
    try {
      if (editingOption) {
        await api.put(`/admin/options/${editingOption.option_id}`, formData);
      } else {
        await api.post('/admin/options', formData);
      }
      toast.success('Saved!');
      loadData();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const deleteOption = async (optionId) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await api.delete(`/admin/options/${optionId}`);
      toast.success('Deleted!');
      loadData();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const openEdit = (option) => {
    setEditingOption(option);
    setFormData({
      category_id: option.category_id,
      name_en: option.name_en,
      name_pt: option.name_pt,
      description_en: option.description_en,
      description_pt: option.description_pt,
      order: option.order
    });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingOption(null);
    setFormData({ category_id: categories[0]?.category_id || '', name_en: '', name_pt: '', description_en: '', description_pt: '', order: 0 });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ category_id: '', name_en: '', name_pt: '', description_en: '', description_pt: '', order: 0 });
    setEditingOption(null);
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.category_id === categoryId);
    return cat ? (language === 'en' ? cat.name_en : cat.name_pt) : '-';
  };

  if (loading) return <div className="spinner mx-auto"></div>;

  return (
    <div data-testid="options-view">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D2A2A]">{t('admin.options')}</h1>
        <Button onClick={openAdd} className="btn-primary" data-testid="add-option-btn">
          <Plus className="w-4 h-4 mr-2" />{t('admin.add')}
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <label className="text-sm font-medium text-[#2D2A2A] mr-3">
          {language === 'en' ? 'Filter by Category:' : 'Filtrar por Categoria:'}
        </label>
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="p-2 border border-[#E5D0CC] rounded-lg bg-white"
          data-testid="category-filter"
        >
          <option value="all">{language === 'en' ? 'All Categories' : 'Todas as Categorias'}</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>
              {language === 'en' ? cat.name_en : cat.name_pt}
            </option>
          ))}
        </select>
        <span className="ml-4 text-sm text-[#8A817C]">
          {filteredOptions.length} {language === 'en' ? 'options' : 'opções'}
        </span>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOption ? t('admin.edit') : t('admin.add')} Option</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('admin.categories')}</label>
              <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="mt-1 w-full p-2 border border-[#E5D0CC] rounded-lg">
                {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{language === 'en' ? cat.name_en : cat.name_pt}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('admin.nameEn')}</label>
                <Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">{t('admin.namePt')}</label>
                <Input value={formData.name_pt} onChange={(e) => setFormData({...formData, name_pt: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t('admin.descriptionEn')}</label>
              <Textarea value={formData.description_en} onChange={(e) => setFormData({...formData, description_en: e.target.value})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">{t('admin.descriptionPt')}</label>
              <Textarea value={formData.description_pt} onChange={(e) => setFormData({...formData, description_pt: e.target.value})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">{t('admin.order')}</label>
              <Input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})} className="mt-1 w-24" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveOption} className="btn-primary">{t('admin.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.categories')}</TableHead>
              <TableHead>{language === 'en' ? 'Name' : 'Nome'}</TableHead>
              <TableHead>{t('admin.order')}</TableHead>
              <TableHead>{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOptions.map((option) => (
              <TableRow key={option.option_id}>
                <TableCell className="text-[#8A817C]">{getCategoryName(option.category_id)}</TableCell>
                <TableCell className="font-medium">{language === 'en' ? option.name_en : option.name_pt}</TableCell>
                <TableCell>{option.order}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(option)} className="p-2 text-[#5C5552] hover:text-[#A86A61]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteOption(option.option_id)} className="p-2 text-[#5C5552] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Tokens View
function TokensView() {
  const { t, language } = useLanguage();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ couple_name: '', couple_email: '', max_uses: 1, expires_at: new Date(Date.now() + 30*24*60*60*1000) });
  const [copiedToken, setCopiedToken] = useState(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const response = await api.get('/admin/tokens');
      setTokens(response.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    try {
      await api.post('/admin/tokens', {
        ...formData,
        expires_at: formData.expires_at.toISOString()
      });
      toast.success('Token generated!');
      loadTokens();
      setDialogOpen(false);
      setFormData({ couple_name: '', couple_email: '', max_uses: 1, expires_at: new Date(Date.now() + 30*24*60*60*1000) });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const deleteToken = async (tokenId) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      await api.delete(`/admin/tokens/${tokenId}`);
      toast.success('Deleted!');
      loadTokens();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    toast.success(t('admin.copied'));
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getTokenStatus = (token) => {
    if (token.current_uses >= token.max_uses) return { label: language === 'en' ? 'Used' : 'Usado', color: 'bg-gray-100 text-gray-800' };
    const expires = new Date(token.expires_at);
    if (expires < new Date()) return { label: language === 'en' ? 'Expired' : 'Expirado', color: 'bg-red-100 text-red-800' };
    return { label: language === 'en' ? 'Available' : 'Disponível', color: 'bg-green-100 text-green-800' };
  };

  if (loading) return <div className="spinner mx-auto"></div>;

  return (
    <div data-testid="tokens-view">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D2A2A]">{t('admin.tokens')}</h1>
        <Button onClick={() => setDialogOpen(true)} className="btn-primary" data-testid="generate-token-btn">
          <Plus className="w-4 h-4 mr-2" />{t('admin.generateToken')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.generateToken')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('admin.coupleName')}</label>
              <Input value={formData.couple_name} onChange={(e) => setFormData({...formData, couple_name: e.target.value})} className="mt-1" placeholder="Ana & Pedro" />
            </div>
            <div>
              <label className="text-sm font-medium">Email ({language === 'en' ? 'optional' : 'opcional'})</label>
              <Input type="email" value={formData.couple_email} onChange={(e) => setFormData({...formData, couple_email: e.target.value})} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">{language === 'en' ? 'Max Uses' : 'Usos Máximos'}</label>
              <Input type="number" min="1" value={formData.max_uses} onChange={(e) => setFormData({...formData, max_uses: parseInt(e.target.value) || 1})} className="mt-1 w-24" />
            </div>
            <div>
              <label className="text-sm font-medium">{language === 'en' ? 'Expires At' : 'Expira em'}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.expires_at, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expires_at}
                    onSelect={(date) => date && setFormData({...formData, expires_at: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={generateToken} className="btn-primary" disabled={!formData.couple_name}>{t('admin.generateToken')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.coupleName')}</TableHead>
              <TableHead>{t('admin.token')}</TableHead>
              <TableHead>{language === 'en' ? 'Uses' : 'Usos'}</TableHead>
              <TableHead>{t('admin.status')}</TableHead>
              <TableHead>{language === 'en' ? 'Expires' : 'Expira'}</TableHead>
              <TableHead>{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => {
              const status = getTokenStatus(token);
              return (
                <TableRow key={token.token_id}>
                  <TableCell className="font-medium">{token.couple_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-[#F5F2F0] px-2 py-1 rounded truncate max-w-[120px]">{token.token}</code>
                      <button onClick={() => copyToken(token.token)} className="p-1 text-[#5C5552] hover:text-[#A86A61]">
                        {copiedToken === token.token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{token.current_uses}/{token.max_uses}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>{status.label}</span></TableCell>
                  <TableCell className="text-[#8A817C]">{new Date(token.expires_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <button onClick={() => deleteToken(token.token_id)} className="p-2 text-[#5C5552] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Birth Plans View
function BirthPlansView() {
  const { t, language } = useLanguage();
  const [birthPlans, setBirthPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editedOptions, setEditedOptions] = useState([]);
  const [editedComments, setEditedComments] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, categoriesRes, optionsRes] = await Promise.all([
        api.get('/admin/birth-plans'),
        api.get('/admin/categories'),
        api.get('/admin/options')
      ]);
      setBirthPlans(plansRes.data);
      setCategories(categoriesRes.data);
      setOptions(optionsRes.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const approvePlan = async (planId) => {
    try {
      await api.post(`/admin/birth-plan/${planId}/approve`);
      toast.success('Birth plan approved!');
      loadData();
    } catch (error) {
      toast.error('Error approving plan');
    }
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setEditedOptions(plan.selected_options || []);
    setEditedComments(plan.comments || '');
  };

  const toggleEditOption = (optionId) => {
    setEditedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const savePlanOptions = async () => {
    try {
      await api.put(`/admin/birth-plan/${editingPlan.plan_id}`, {
        selected_options: editedOptions,
        visited_categories: editingPlan.visited_categories || [],
        current_category_index: editingPlan.current_category_index || 0,
        comments: editedComments
      });
      toast.success('Birth plan updated!');
      loadData();
      setEditingPlan(null);
    } catch (error) {
      toast.error('Error updating plan');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return { label: language === 'en' ? 'Approved' : 'Aprovado', color: 'bg-green-100 text-green-800' };
      case 'pending_review': return { label: language === 'en' ? 'Pending' : 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
      default: return { label: language === 'en' ? 'In Progress' : 'Em Progresso', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getOptionName = (option) => language === 'en' ? option.name_en : option.name_pt;
  const getCategoryName = (category) => language === 'en' ? category.name_en : category.name_pt;
  const getCategoryOptions = (categoryId) => options.filter(opt => opt.category_id === categoryId);

  if (loading) return <div className="spinner mx-auto"></div>;

  return (
    <div data-testid="birth-plans-view">
      <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D2A2A] mb-8">{t('admin.birthPlans')}</h1>
      
      {/* Edit Birth Plan Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-plan-description">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Edit Birth Plan' : 'Editar Plano de Parto'}: {editingPlan?.couple_name}
            </DialogTitle>
            <p id="edit-plan-description" className="text-sm text-[#8A817C]">
              {language === 'en' 
                ? 'Select or deselect options to modify this birth plan.' 
                : 'Selecione ou desmarque opções para modificar este plano de parto.'}
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {categories.map(cat => {
              const catOptions = getCategoryOptions(cat.category_id);
              if (catOptions.length === 0) return null;
              
              return (
                <div key={cat.category_id} className="border-b border-[#E5D0CC] pb-4">
                  <h3 className="font-semibold text-[#2D2A2A] mb-3">{getCategoryName(cat)}</h3>
                  <div className="space-y-2">
                    {catOptions.map(opt => {
                      const isSelected = editedOptions.includes(opt.option_id);
                      return (
                        <div 
                          key={opt.option_id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#E5D0CC]/30' : 'hover:bg-[#F5F2F0]'
                          }`}
                          onClick={() => toggleEditOption(opt.option_id)}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-[#A86A61] border-[#A86A61]' : 'border-[#D4Beb9]'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${isSelected ? 'text-[#2D2A2A] font-medium' : 'text-[#5C5552]'}`}>
                            {getOptionName(opt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* Comments Section */}
            <div className="border-t border-[#E5D0CC] pt-4">
              <h3 className="font-semibold text-[#2D2A2A] mb-3">
                {language === 'en' ? 'Additional Comments' : 'Comentários Adicionais'}
              </h3>
              <Textarea
                value={editedComments}
                onChange={(e) => setEditedComments(e.target.value)}
                placeholder={language === 'en' 
                  ? 'User comments will appear here...'
                  : 'Comentários do usuário aparecerão aqui...'}
                className="min-h-[120px] border-[#E5D0CC] focus:border-[#A86A61]"
                data-testid="admin-comments-textarea"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingPlan(null)}>
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </Button>
            <Button onClick={savePlanOptions} className="btn-primary">
              {language === 'en' ? 'Save Changes' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.coupleName')}</TableHead>
              <TableHead>{language === 'en' ? 'Options' : 'Opções'}</TableHead>
              <TableHead>{language === 'en' ? 'Comments' : 'Comentários'}</TableHead>
              <TableHead>{t('admin.status')}</TableHead>
              <TableHead>{t('admin.createdAt')}</TableHead>
              <TableHead>{t('admin.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {birthPlans.map((plan) => {
              const status = getStatusBadge(plan.status);
              return (
                <TableRow key={plan.plan_id}>
                  <TableCell className="font-medium">{plan.couple_name}</TableCell>
                  <TableCell>{plan.selected_options?.length || 0}</TableCell>
                  <TableCell>
                    {plan.comments ? (
                      <span className="text-[#A86A61] text-xs">
                        {plan.comments.length > 30 ? `${plan.comments.substring(0, 30)}...` : plan.comments}
                      </span>
                    ) : (
                      <span className="text-[#8A817C] text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>{status.label}</span></TableCell>
                  <TableCell className="text-[#8A817C]">{new Date(plan.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => openEditPlan(plan)} 
                        variant="outline" 
                        size="sm"
                        data-testid={`view-plan-${plan.plan_id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {language === 'en' ? 'View/Edit' : 'Ver/Editar'}
                      </Button>
                      {plan.status === 'pending_review' && (
                        <Button onClick={() => approvePlan(plan.plan_id)} size="sm" className="btn-primary text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />{language === 'en' ? 'Approve' : 'Aprovar'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Email Templates View
function EmailTemplatesView() {
  const { language } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ subject_en: '', subject_pt: '', body_en: '', body_pt: '' });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/admin/email-templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    try {
      await api.put(`/admin/email-templates/${editingTemplate.template_id}`, formData);
      toast.success('Template saved!');
      loadTemplates();
      setEditingTemplate(null);
    } catch (error) {
      toast.error('Error saving template');
    }
  };

  const openEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      subject_en: template.subject_en,
      subject_pt: template.subject_pt,
      body_en: template.body_en,
      body_pt: template.body_pt
    });
  };

  if (loading) return <div className="spinner mx-auto"></div>;

  return (
    <div data-testid="email-templates-view">
      <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D2A2A] mb-8">
        {language === 'en' ? 'Email Templates' : 'Templates de Email'}
      </h1>

      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Edit Template' : 'Editar Template'}: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{language === 'en' ? 'Subject (English)' : 'Assunto (Inglês)'}</label>
                <Input value={formData.subject_en} onChange={(e) => setFormData({...formData, subject_en: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">{language === 'en' ? 'Subject (Portuguese)' : 'Assunto (Português)'}</label>
                <Input value={formData.subject_pt} onChange={(e) => setFormData({...formData, subject_pt: e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{language === 'en' ? 'Body (English)' : 'Corpo (Inglês)'}</label>
              <Textarea value={formData.body_en} onChange={(e) => setFormData({...formData, body_en: e.target.value})} className="mt-1 font-mono text-sm" rows={10} />
            </div>
            <div>
              <label className="text-sm font-medium">{language === 'en' ? 'Body (Portuguese)' : 'Corpo (Português)'}</label>
              <Textarea value={formData.body_pt} onChange={(e) => setFormData({...formData, body_pt: e.target.value})} className="mt-1 font-mono text-sm" rows={10} />
            </div>
            <div className="bg-[#F5F2F0] p-3 rounded-lg text-sm text-[#5C5552]">
              <strong>{language === 'en' ? 'Available placeholders' : 'Placeholders disponíveis'}:</strong> {'{{couple_name}}'}, {'{{token}}'}, {'{{expires_at}}'}, {'{{birth_plan_url}}'}, {'{{view_url}}'}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveTemplate} className="btn-primary">{language === 'en' ? 'Save' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.template_id} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-[#2D2A2A]">{template.name}</h3>
                <p className="text-sm text-[#8A817C] mt-1">{language === 'en' ? template.subject_en : template.subject_pt}</p>
              </div>
              <Button onClick={() => openEdit(template)} variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-2" />{language === 'en' ? 'Edit' : 'Editar'}
              </Button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-center text-[#8A817C] py-8">
            {language === 'en' ? 'No templates found. Seed initial data first.' : 'Nenhum template encontrado. Insira os dados iniciais primeiro.'}
          </p>
        )}
      </div>
    </div>
  );
}

// Contacts View
function ContactsView() {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await api.get('/admin/contacts');
      setContacts(response.data);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner mx-auto"></div>;

  return (
    <div data-testid="contacts-view">
      <h1 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D2A2A] mb-8">{t('admin.contacts')}</h1>
      <div className="space-y-4">
        {contacts.map((contact) => (
          <div key={contact.submission_id} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-[#2D2A2A]">{contact.name}</h3>
                <p className="text-sm text-[#8A817C]">{contact.email}</p>
                {contact.phone && <p className="text-sm text-[#8A817C]">{contact.phone}</p>}
              </div>
              <span className="text-xs text-[#8A817C]">{new Date(contact.created_at).toLocaleString()}</span>
            </div>
            <p className="text-[#5C5552]">{contact.message}</p>
          </div>
        ))}
        {contacts.length === 0 && <p className="text-center text-[#8A817C] py-8">No contact submissions yet</p>}
      </div>
    </div>
  );
}
