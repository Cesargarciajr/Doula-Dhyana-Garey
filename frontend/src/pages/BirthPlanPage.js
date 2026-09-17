import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Switch } from '../components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { Textarea } from '../components/ui/textarea';
import { 
  Heart, 
  Info, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  FileDown,
  Globe,
  ClipboardList,
  Eye,
  AlertTriangle,
  Pencil,
  MessageSquare
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BirthPlanPage() {
  const { planId: urlPlanId } = useParams();
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  
  const [token, setToken] = useState('');
  const [tokenData, setTokenData] = useState(null); // Store token info for attempt tracking
  const [planId, setPlanId] = useState(urlPlanId || null);
  const [coupleName, setCoupleName] = useState('');
  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [visitedCategories, setVisitedCategories] = useState([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [planStatus, setPlanStatus] = useState('in_progress');
  const [isReviewing, setIsReviewing] = useState(false);
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [comments, setComments] = useState('');

  // Calculate progress based on visited categories
  const totalCategories = categories.length;
  const progress = totalCategories > 0 ? Math.round((visitedCategories.length / totalCategories) * 100) : 0;
  const isLastCategory = currentCategoryIndex === totalCategories - 1;
  const canReview = progress === 100;

  // Load existing birth plan if planId is in URL
  useEffect(() => {
    if (urlPlanId) {
      loadBirthPlan(urlPlanId);
    }
  }, [urlPlanId]);

  const loadBirthPlan = async (id) => {
    setLoading(true);
    try {
      const [planRes, categoriesRes, optionsRes] = await Promise.all([
        axios.get(`${API}/birth-plan/${id}`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/options`)
      ]);
      
      setPlanId(id);
      setCoupleName(planRes.data.couple_name);
      setSelectedOptions(planRes.data.selected_options || []);
      setVisitedCategories(planRes.data.visited_categories || []);
      setCurrentCategoryIndex(planRes.data.current_category_index || 0);
      setPlanStatus(planRes.data.status || 'in_progress');
      setComments(planRes.data.comments || '');
      setCategories(categoriesRes.data);
      setOptions(optionsRes.data);
      
      // Fetch token info for the birth plan
      try {
        const tokenInfoRes = await axios.get(`${API}/birth-plan/${id}/token-info`);
        setTokenData(tokenInfoRes.data);
      } catch (tokenErr) {
        console.log('Could not fetch token info');
      }
    } catch (error) {
      toast.error(t('birthPlan.invalidToken'));
      navigate('/birth-plan');
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async () => {
    if (!token.trim()) return;
    
    setValidating(true);
    try {
      const response = await axios.post(`${API}/validate-token?token=${encodeURIComponent(token.trim())}`);
      setPlanId(response.data.plan_id);
      setCoupleName(response.data.couple_name);
      setTokenData(response.data.token_info); // Store token info
      
      // Load categories and options
      const [categoriesRes, optionsRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/options`)
      ]);
      
      setCategories(categoriesRes.data);
      setOptions(optionsRes.data);
      
      // If existing plan, load its data
      if (response.data.existing) {
        const planRes = await axios.get(`${API}/birth-plan/${response.data.plan_id}`);
        setSelectedOptions(planRes.data.selected_options || []);
        setVisitedCategories(planRes.data.visited_categories || []);
        setCurrentCategoryIndex(planRes.data.current_category_index || 0);
        setPlanStatus(planRes.data.status || 'in_progress');
        setComments(planRes.data.comments || '');
      }
      
      // Update URL
      navigate(`/birth-plan/${response.data.plan_id}`, { replace: true });
      
      toast.success(`${t('birthPlan.welcome')}, ${response.data.couple_name}!`);
    } catch (error) {
      if (error.response?.status === 400) {
        const detail = error.response?.data?.detail || '';
        if (detail.includes('maximum uses')) {
          toast.error(t('birthPlan.maxUsesReached') || 'Token has reached maximum uses');
        } else if (detail.includes('expired')) {
          toast.error(t('birthPlan.invalidToken'));
        } else {
          toast.error(t('birthPlan.usedToken'));
        }
      } else {
        toast.error(t('birthPlan.invalidToken'));
      }
    } finally {
      setValidating(false);
    }
  };

  const toggleOption = async (optionId) => {
    const newSelected = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    
    setSelectedOptions(newSelected);
    
    // Save to backend
    try {
      await axios.put(`${API}/birth-plan/${planId}`, {
        selected_options: newSelected,
        visited_categories: visitedCategories,
        current_category_index: currentCategoryIndex
      });
    } catch (error) {
      console.error('Error saving birth plan:', error);
    }
  };

  const goToNextCategory = async () => {
    const currentCategory = categories[currentCategoryIndex];
    
    // Mark current category as visited if not already
    let newVisited = visitedCategories;
    if (!visitedCategories.includes(currentCategory.category_id)) {
      newVisited = [...visitedCategories, currentCategory.category_id];
      setVisitedCategories(newVisited);
    }
    
    // Move to next category
    const nextIndex = currentCategoryIndex + 1;
    setCurrentCategoryIndex(nextIndex);
    
    // Save progress
    try {
      await axios.put(`${API}/birth-plan/${planId}`, {
        selected_options: selectedOptions,
        visited_categories: newVisited,
        current_category_index: nextIndex
      });
    } catch (error) {
      console.error('Error saving birth plan:', error);
    }
  };

  const goToPreviousCategory = async () => {
    if (currentCategoryIndex > 0) {
      const prevIndex = currentCategoryIndex - 1;
      setCurrentCategoryIndex(prevIndex);
      
      // Save progress
      try {
        await axios.put(`${API}/birth-plan/${planId}`, {
          selected_options: selectedOptions,
          visited_categories: visitedCategories,
          current_category_index: prevIndex
        });
      } catch (error) {
        console.error('Error saving birth plan:', error);
      }
    }
  };

  const markLastCategoryVisited = async () => {
    const lastCat = categories[currentCategoryIndex];
    if (!visitedCategories.includes(lastCat.category_id)) {
      const newVisited = [...visitedCategories, lastCat.category_id];
      setVisitedCategories(newVisited);
      await axios.put(`${API}/birth-plan/${planId}`, {
        selected_options: selectedOptions,
        visited_categories: newVisited,
        current_category_index: currentCategoryIndex
      });
    }
  };

  const handleReviewClick = async () => {
    await markLastCategoryVisited();
    setIsReviewing(true);
  };

  const handleDownloadClick = () => {
    setShowDownloadWarning(true);
  };

  const handleEditSubmitted = async () => {
    // Check if there are remaining uses
    if (!tokenData || tokenData.remaining_uses <= 0) {
      toast.error(language === 'en' 
        ? "You don't have any edit attempts left" 
        : "Você não tem mais tentativas de edição disponíveis");
      setShowEditWarning(false);
      return;
    }
    
    setShowEditWarning(false);
    
    // Reset the birth plan to in_progress status
    try {
      await axios.post(`${API}/birth-plan/${planId}/reset`);
      setPlanStatus('in_progress');
      setVisitedCategories([]);
      setCurrentCategoryIndex(0);
      toast.success(language === 'en' ? 'You can now edit your birth plan' : 'Agora você pode editar seu plano de parto');
    } catch (error) {
      if (error.response?.data?.detail === 'No remaining edit attempts') {
        toast.error(language === 'en' 
          ? "You don't have any edit attempts left" 
          : "Você não tem mais tentativas de edição disponíveis");
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  const confirmDownload = async () => {
    setShowDownloadWarning(false);
    
    try {
      // Save comments before completing
      await axios.put(`${API}/birth-plan/${planId}`, {
        selected_options: selectedOptions,
        visited_categories: visitedCategories,
        current_category_index: currentCategoryIndex,
        comments: comments
      });
      
      // Complete the birth plan
      await axios.post(`${API}/birth-plan/${planId}/complete`);
      setPlanStatus('pending_review');
      
      // Generate PDF
      generatePDF();
      
      toast.success(t('birthPlan.planComplete'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const getCategoryOptions = (categoryId) => {
    return options.filter(opt => opt.category_id === categoryId);
  };

  const getOptionName = (option) => {
    return language === 'en' ? option.name_en : option.name_pt;
  };

  const getOptionDescription = (option) => {
    return language === 'en' ? option.description_en : option.description_pt;
  };

  const getCategoryName = (category) => {
    return language === 'en' ? category.name_en : category.name_pt;
  };

  const generatePDF = () => {
    const selectedOptionsList = options.filter(opt => selectedOptions.includes(opt.option_id));
    
    const commentsSection = comments.trim() ? `
      <div class="comments-section">
        <h2>${language === 'en' ? 'Additional Comments' : 'Comentários Adicionais'}</h2>
        <div class="comments-box">${comments.replace(/\n/g, '<br>')}</div>
      </div>
    ` : '';
    
    const printContent = `
      <html>
        <head>
          <title>Birth Plan - ${coupleName}</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #A86A61; border-bottom: 2px solid #E5D0CC; padding-bottom: 10px; }
            h2 { color: #2D2A2A; margin-top: 30px; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #F5F2F0; }
            .header { text-align: center; margin-bottom: 30px; }
            .category { margin-bottom: 20px; }
            .option-name { font-weight: bold; }
            .option-desc { color: #5C5552; font-size: 14px; margin-top: 4px; }
            .comments-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5D0CC; }
            .comments-box { background: #F5F2F0; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${language === 'en' ? 'Birth Plan' : 'Plano de Parto'}</h1>
            <p>${language === 'en' ? 'Prepared for' : 'Preparado para'}: ${coupleName}</p>
            <p>${language === 'en' ? 'Date' : 'Data'}: ${new Date().toLocaleDateString()}</p>
          </div>
          ${categories.map(cat => {
            const catOptions = selectedOptionsList.filter(opt => opt.category_id === cat.category_id);
            if (catOptions.length === 0) return '';
            return `
              <div class="category">
                <h2>${getCategoryName(cat)}</h2>
                <ul>
                  ${catOptions.map(opt => `
                    <li>
                      <div class="option-name">✓ ${getOptionName(opt)}</div>
                      <div class="option-desc">${getOptionDescription(opt)}</div>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `;
          }).join('')}
          ${commentsSection}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Token entry screen
  if (!planId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-[#E5D0CC]/30 flex items-center justify-center p-6" data-testid="birth-plan-token-page">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#E5D0CC] rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-[#A86A61]" />
            </div>
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#2D2A2A] mb-2">
              {t('birthPlan.title')}
            </h1>
            <p className="text-[#5C5552]">{t('birthPlan.enterToken')}</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="space-y-4">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('birthPlan.tokenPlaceholder')}
                className="border-[#E5D0CC] focus:border-[#A86A61]"
                data-testid="token-input"
              />
              <Button
                onClick={validateToken}
                className="btn-primary w-full"
                disabled={validating || !token.trim()}
                data-testid="validate-token-btn"
              >
                {validating ? t('common.loading') : t('birthPlan.validate')}
              </Button>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-[#5C5552]"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
              </Button>
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-[#5C5552] hover:text-[#A86A61]"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'PT' : 'EN'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2F0]">
        <div className="spinner"></div>
      </div>
    );
  }

  // Pending review or approved state (after completing)
  if ((planStatus === 'pending_review' || planStatus === 'approved') && !isReviewing) {
    const canEdit = tokenData && tokenData.remaining_uses > 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-[#E5D0CC]/30 flex items-center justify-center p-6" data-testid="birth-plan-complete">
        <div className="max-w-md w-full text-center">
          <div className={`w-20 h-20 ${planStatus === 'approved' ? 'bg-[#7A9E7E]' : 'bg-[#E8B9AB]'} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#2D2A2A] mb-4">
            {planStatus === 'approved' 
              ? (language === 'en' ? 'Birth Plan Approved!' : 'Plano de Parto Aprovado!')
              : (language === 'en' ? 'Birth Plan Submitted!' : 'Plano de Parto Enviado!')}
          </h1>
          <p className="text-[#5C5552] mb-8">
            {planStatus === 'approved'
              ? (language === 'en' ? 'Your birth plan has been approved. You can download it below.' : 'Seu plano de parto foi aprovado. Você pode baixá-lo abaixo.')
              : (language === 'en' ? 'Your birth plan is pending review. You will receive an email once it is approved.' : 'Seu plano de parto está aguardando revisão. Você receberá um email quando for aprovado.')}
          </p>
          
          {planStatus === 'approved' && (
            <Button
              onClick={generatePDF}
              className="btn-primary mb-4"
              data-testid="download-pdf-btn"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {t('birthPlan.downloadPDF')}
            </Button>
          )}
          
          {/* Edit option if token has remaining uses */}
          {canEdit && (
            <div className="mt-6 p-4 bg-[#F5F2F0] rounded-lg">
              <p className="text-sm text-[#5C5552] mb-3">
                {language === 'en' 
                  ? `You have ${tokenData.remaining_uses} edit attempt(s) remaining.`
                  : `Você tem ${tokenData.remaining_uses} tentativa(s) de edição restante(s).`}
              </p>
              <Button
                onClick={() => setShowEditWarning(true)}
                variant="outline"
                className="btn-outline"
                data-testid="edit-submitted-btn"
              >
                <Pencil className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Edit Birth Plan' : 'Editar Plano de Parto'}
              </Button>
            </div>
          )}
          
          {/* Message when no more attempts left */}
          {tokenData && tokenData.remaining_uses <= 0 && (
            <div className="mt-6 p-4 bg-[#FEF3F2] rounded-lg border border-[#FECDC9]" data-testid="no-attempts-message">
              <p className="text-sm text-[#B42318]">
                {language === 'en' 
                  ? "You don't have any more edit attempts left. Please contact Dhyana if you need to make changes."
                  : "Você não tem mais tentativas de edição disponíveis. Por favor, entre em contato com Dhyana se precisar fazer alterações."}
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-[#5C5552]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        </div>
        
        {/* Edit Warning Dialog */}
        <AlertDialog open={showEditWarning} onOpenChange={setShowEditWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E8B9AB]" />
                {language === 'en' ? 'Edit Birth Plan?' : 'Editar Plano de Parto?'}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="text-[#5C5552]">
                  <p>
                    {language === 'en' 
                      ? 'Editing your birth plan will overwrite your previous submission. You will need to go through all categories again and resubmit for review.'
                      : 'Editar seu plano de parto substituirá sua submissão anterior. Você precisará passar por todas as categorias novamente e reenviar para revisão.'}
                  </p>
                  
                  <div className="mt-4 p-3 bg-[#F5F2F0] rounded-lg">
                    <div className="font-medium text-[#2D2A2A]">
                      {language === 'en' ? 'Remaining attempts:' : 'Tentativas restantes:'}
                    </div>
                    <div className="text-sm mt-1">
                      {tokenData?.remaining_uses || 0}
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="btn-outline">
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleEditSubmitted} className="btn-primary">
                {language === 'en' ? 'Edit' : 'Editar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Review page
  if (isReviewing) {
    const selectedOptionsList = options.filter(opt => selectedOptions.includes(opt.option_id));
    
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#FAFAF9]" data-testid="birth-plan-review">
          {/* Header */}
          <header className="bg-white border-b border-[#E5D0CC]/30 sticky top-0 z-40">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setIsReviewing(false)}
                    className="text-[#5C5552]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div>
                    <h1 className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2A2A]">
                      {language === 'en' ? 'Review Your Birth Plan' : 'Revise Seu Plano de Parto'}
                    </h1>
                    <p className="text-sm text-[#8A817C]">{coupleName}</p>
                  </div>
                </div>
                <button 
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 text-[#5C5552] hover:text-[#A86A61]"
                >
                  <Globe className="w-4 h-4" />
                  {language === 'en' ? 'PT' : 'EN'}
                </button>
              </div>
            </div>
          </header>

          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm mb-6">
              <div className="text-center mb-8">
                <Eye className="w-12 h-12 text-[#A86A61] mx-auto mb-4" />
                <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-[#2D2A2A] mb-2">
                  {language === 'en' ? 'Your Selections' : 'Suas Seleções'}
                </h2>
                <p className="text-[#8A817C]">
                  {language === 'en' 
                    ? `${selectedOptions.length} options selected across ${categories.length} categories`
                    : `${selectedOptions.length} opções selecionadas em ${categories.length} categorias`}
                </p>
              </div>

              {categories.map(cat => {
                const catOptions = selectedOptionsList.filter(opt => opt.category_id === cat.category_id);
                if (catOptions.length === 0) return null;
                
                return (
                  <div key={cat.category_id} className="mb-8">
                    <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2A2A] mb-4 pb-2 border-b border-[#E5D0CC]">
                      {getCategoryName(cat)}
                    </h3>
                    <ul className="space-y-3">
                      {catOptions.map(opt => (
                        <li key={opt.option_id} className="flex items-start gap-3 p-3 bg-[#F5F2F0] rounded-lg">
                          <Check className="w-5 h-5 text-[#A86A61] mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-[#2D2A2A]">{getOptionName(opt)}</div>
                            <div className="text-sm text-[#8A817C] mt-1">{getOptionDescription(opt)}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {selectedOptions.length === 0 && (
                <p className="text-center text-[#8A817C] py-8">
                  {language === 'en' ? 'No options selected' : 'Nenhuma opção selecionada'}
                </p>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm mb-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-5 h-5 text-[#A86A61]" />
                <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2A2A]">
                  {language === 'en' ? 'Additional Comments' : 'Comentários Adicionais'}
                </h3>
              </div>
              <p className="text-sm text-[#8A817C] mb-4">
                {language === 'en' 
                  ? 'Add any additional notes or preferences not covered by the options above.'
                  : 'Adicione quaisquer notas ou preferências adicionais não cobertas pelas opções acima.'}
              </p>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={language === 'en' 
                  ? 'Enter any additional comments or special requests here...'
                  : 'Digite quaisquer comentários adicionais ou solicitações especiais aqui...'}
                className="min-h-[150px] border-[#E5D0CC] focus:border-[#A86A61] resize-none"
                data-testid="comments-textarea"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setIsReviewing(false)}
                className="btn-outline"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Back to Edit' : 'Voltar para Editar'}
              </Button>
              
              <Button
                onClick={handleDownloadClick}
                className="btn-primary"
                data-testid="generate-pdf-btn"
              >
                <FileDown className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Generate PDF' : 'Gerar PDF'}
              </Button>
            </div>
          </div>

          {/* Download Warning Dialog */}
          <AlertDialog open={showDownloadWarning} onOpenChange={setShowDownloadWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#E8B9AB]" />
                  {language === 'en' ? 'Confirm Download' : 'Confirmar Download'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[#5C5552]">
                  {language === 'en' 
                    ? 'Generating the PDF will use one attempt of your token. After this, your birth plan will be submitted for review.'
                    : 'Gerar o PDF usará uma tentativa do seu token. Após isso, seu plano de parto será enviado para revisão.'}
                  
                  {tokenData && (
                    <div className="mt-4 p-3 bg-[#F5F2F0] rounded-lg">
                      <div className="font-medium text-[#2D2A2A]">
                        {language === 'en' ? 'Token Status:' : 'Status do Token:'}
                      </div>
                      <div className="text-sm mt-1">
                        {language === 'en' 
                          ? `${tokenData.remaining_uses} attempt(s) remaining`
                          : `${tokenData.remaining_uses} tentativa(s) restante(s)`}
                      </div>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="btn-outline">
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </AlertDialogCancel>
                <AlertDialogAction onClick={confirmDownload} className="btn-primary">
                  {language === 'en' ? 'Proceed' : 'Continuar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    );
  }

  // Birth plan builder
  const currentCategory = categories[currentCategoryIndex];
  const currentCategoryOptions = currentCategory ? getCategoryOptions(currentCategory.category_id) : [];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#FAFAF9]" data-testid="birth-plan-builder">
        {/* Header */}
        <header className="bg-white border-b border-[#E5D0CC]/30 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-[#5C5552]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2A2A]">
                    {t('birthPlan.title')}
                  </h1>
                  <p className="text-sm text-[#8A817C]">{coupleName}</p>
                </div>
              </div>
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-[#5C5552] hover:text-[#A86A61]"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'PT' : 'EN'}
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#5C5552]">
                  {language === 'en' ? 'Category' : 'Categoria'} {currentCategoryIndex + 1} {language === 'en' ? 'of' : 'de'} {totalCategories}
                </span>
                <span className="text-[#A86A61] font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 bg-[#E5D0CC]" />
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {currentCategory && (
            <div className="category-container bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-semibold text-[#2D2A2A] mb-2">
                {getCategoryName(currentCategory)}
              </h2>
              <p className="text-[#8A817C] mb-6">
                {language === 'en' ? currentCategory.description_en : currentCategory.description_pt}
              </p>
              
              {currentCategoryOptions.length === 0 ? (
                <p className="text-[#8A817C] italic">{t('birthPlan.noOptions')}</p>
              ) : (
                <div className="space-y-3">
                  {currentCategoryOptions.map((option) => {
                    const isSelected = selectedOptions.includes(option.option_id);
                    
                    return (
                      <div
                        key={option.option_id}
                        className={`toggle-item flex items-center justify-between p-4 rounded-lg cursor-pointer border transition-colors ${
                          isSelected 
                            ? 'bg-[#E5D0CC]/30 border-[#A86A61]' 
                            : 'border-transparent hover:bg-[#FAFAF9] hover:border-[#E5D0CC]'
                        }`}
                        onClick={() => toggleOption(option.option_id)}
                        data-testid={`option-${option.option_id}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => toggleOption(option.option_id)}
                            className="data-[state=checked]:bg-[#A86A61]"
                          />
                          <span className="font-medium text-[#2D2A2A]">
                            {getOptionName(option)}
                          </span>
                        </div>
                        
                        {/* Desktop: Tooltip on hover */}
                        <div className="hidden md:block">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="p-2 text-[#8A817C] hover:text-[#A86A61]">
                                <Info className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs bg-[#2D2A2A] text-white p-3">
                              {getOptionDescription(option)}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        {/* Mobile: Dialog on click */}
                        <div className="md:hidden">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button 
                                className="p-2 text-[#8A817C] hover:text-[#A86A61]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{getOptionName(option)}</DialogTitle>
                              </DialogHeader>
                              <p className="text-[#5C5552]">{getOptionDescription(option)}</p>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="mt-8 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={goToPreviousCategory}
                  disabled={currentCategoryIndex === 0}
                  className="btn-outline"
                  data-testid="prev-category-btn"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t('common.previous')}
                </Button>
                
                {isLastCategory ? (
                  canReview ? (
                    <Button
                      onClick={handleReviewClick}
                      className="btn-primary"
                      data-testid="review-btn"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Review' : 'Revisar'}
                    </Button>
                  ) : (
                    <Button
                      onClick={markLastCategoryVisited}
                      className="btn-primary"
                      data-testid="mark-complete-btn"
                    >
                      {language === 'en' ? 'Mark Complete' : 'Marcar Completo'}
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={goToNextCategory}
                    className="btn-primary"
                    data-testid="next-category-btn"
                  >
                    {t('common.next')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Category navigation dots */}
          <div className="mt-6 flex justify-center gap-2">
            {categories.map((cat, index) => (
              <button
                key={cat.category_id}
                onClick={() => {
                  if (index <= visitedCategories.length) {
                    setCurrentCategoryIndex(index);
                  }
                }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentCategoryIndex
                    ? 'bg-[#A86A61]'
                    : visitedCategories.includes(cat.category_id)
                    ? 'bg-[#D4Beb9]'
                    : 'bg-[#E5D0CC]'
                }`}
                disabled={index > visitedCategories.length}
                data-testid={`category-dot-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
