import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, FileText, Send, Landmark, Plus, Link, HelpCircle, Trash2, RefreshCw, Copy } from 'lucide-react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import { useToast, useConfirm } from '../components/Toast';

const Templates = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('document');
  const [loading, setLoading] = useState(false);
  const { toastSuccess, toastError } = useToast();
  const { confirm } = useConfirm();

  // Lists states — all from DB
  const [documentTemplates, setDocumentTemplates] = useState([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [postalTemplates, setPostalTemplates] = useState([]);
  const [smsTemplates, setSmsTemplates] = useState([]);

  const fetchTemplatesForTab = async (tabId) => {
    setLoading(true);
    try {
      if (tabId === 'document') {
        const response = await axios.get(API_ENDPOINTS.TEMPLATES_DOCUMENTS);
        setDocumentTemplates(response.data || []);
      } else if (tabId === 'whatsapp') {
        const response = await axios.get(API_ENDPOINTS.TEMPLATES_WHATSAPP);
        setWhatsappTemplates(response.data || []);
      } else if (tabId === 'email') {
        const response = await axios.get(API_ENDPOINTS.TEMPLATES_EMAIL);
        setEmailTemplates(response.data || []);
      } else if (tabId === 'sms') {
        const response = await axios.get(API_ENDPOINTS.TEMPLATES_SMS);
        setSmsTemplates(response.data || []);
      } else if (tabId === 'postal') {
        const response = await axios.get(API_ENDPOINTS.TEMPLATES_POSTAL);
        setPostalTemplates(response.data || []);
      }
    } catch (err) {
      console.error(`Failed to fetch ${tabId} templates from REST API.`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesForTab(activeTab);
  }, [activeTab]);

  const handleDelete = async (e, type, id) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Template',
      message: 'This will permanently remove the template from the database. This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
    });
    if (!ok) return;
    const endpoints = {
      document: API_ENDPOINTS.TEMPLATES_DOCUMENTS,
      whatsapp: API_ENDPOINTS.TEMPLATES_WHATSAPP,
      email: API_ENDPOINTS.TEMPLATES_EMAIL,
      sms: API_ENDPOINTS.TEMPLATES_SMS,
      postal: API_ENDPOINTS.TEMPLATES_POSTAL,
    };
    try {
      await axios.delete(`${endpoints[type]}/${id}`);
      toastSuccess('Template Deleted', 'The template was removed from the database.');
      fetchTemplatesForTab(activeTab);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      toastError('Delete Failed', msg);
    }
  };

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toastSuccess('Copied to Clipboard', `Code "${code}" copied successfully.`);
  };

  const tabStyles = {
    document: {
      inactiveBorder: 'border-indigo-100 dark:border-indigo-950/20 hover:border-indigo-300',
      inactiveBg: 'bg-indigo-500/[0.02]',
      inactiveIcon: 'bg-indigo-500/[0.06] text-indigo-500/70',
      activeBorder: 'border-indigo-500 ring-1 ring-indigo-500/20',
      activeBg: 'bg-indigo-500/[0.08]',
      activeIcon: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      glow: 'bg-indigo-500/5'
    },
    whatsapp: {
      inactiveBorder: 'border-emerald-100 dark:border-emerald-950/20 hover:border-emerald-300',
      inactiveBg: 'bg-emerald-500/[0.02]',
      inactiveIcon: 'bg-emerald-500/[0.06] text-emerald-500/70',
      activeBorder: 'border-emerald-500 ring-1 ring-emerald-500/20',
      activeBg: 'bg-emerald-500/[0.08]',
      activeIcon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      glow: 'bg-emerald-500/5'
    },
    email: {
      inactiveBorder: 'border-rose-100 dark:border-rose-950/20 hover:border-rose-300',
      inactiveBg: 'bg-rose-500/[0.02]',
      inactiveIcon: 'bg-rose-500/[0.06] text-rose-500/70',
      activeBorder: 'border-rose-500 ring-1 ring-rose-500/20',
      activeBg: 'bg-rose-500/[0.08]',
      activeIcon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
      glow: 'bg-rose-500/5'
    },
    postal: {
      inactiveBorder: 'border-amber-100 dark:border-amber-950/20 hover:border-amber-300',
      inactiveBg: 'bg-amber-500/[0.02]',
      inactiveIcon: 'bg-amber-500/[0.06] text-amber-500/70',
      activeBorder: 'border-amber-500 ring-1 ring-amber-500/20',
      activeBg: 'bg-amber-500/[0.08]',
      activeIcon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      glow: 'bg-amber-500/5'
    },
    sms: {
      inactiveBorder: 'border-sky-100 dark:border-sky-950/20 hover:border-sky-300',
      inactiveBg: 'bg-sky-500/[0.02]',
      inactiveIcon: 'bg-sky-500/[0.06] text-sky-500/70',
      activeBorder: 'border-sky-500 ring-1 ring-sky-500/20',
      activeBg: 'bg-sky-500/[0.08]',
      activeIcon: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
      glow: 'bg-sky-500/5'
    }
  };

  const tabs = [
    { id: 'whatsapp', label: 'WhatsApp Templates', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'email', label: 'Email Templates', icon: <Mail className="h-4 w-4" /> },
    { id: 'postal', label: 'Postal Templates', icon: <Landmark className="h-4 w-4" /> },
    { id: 'sms', label: 'SMS Templates', icon: <Send className="h-4 w-4" /> },
  ];

  const getLinkedDocNames = (documentTemplates, ids) => {
    if (!ids || ids.length === 0) return [];
    return ids.map(id => {
      const found = documentTemplates.find(d => String(d.id) === String(id));
      return found ? found.templateName : id;
    });
  };

  const renderLinkedDocs = (documentTemplatesList) => {
    const list = documentTemplatesList || [];
    if (list.length === 0) return <span className="font-semibold text-slate-500 italic">None</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {list.map((doc, i) => (
          <span key={i} className="font-bold text-primary underline mr-1.5">{doc.templateName}</span>
        ))}
      </div>
    );
  };

  const CardWrapper = ({ onClick, children }) => (
    <div
      onClick={onClick}
      className="p-5 bg-card border border-border hover:border-primary/40 rounded-xl space-y-4 cursor-pointer transition-all duration-200 relative group"
    >
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Communication Templates</h1>
          <p className="text-muted-foreground mt-1">Configure base documents and channel templates. Channels can link Document templates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTemplatesForTab(activeTab)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-border hover:bg-muted text-foreground font-semibold rounded-lg text-sm cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => navigate(`/templates/new/${activeTab}`)}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:bg-primary/95 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Premium Segmented Card Switcher with Hierarchical Separation */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch bg-white dark:bg-card border border-border/60 p-4 rounded-2xl">
        {/* Level 1: Root Core Layouts */}
        <div className="flex-none lg:w-1/4 flex flex-col space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">Level 1: Core Base</span>
          </div>
          <button
            onClick={() => setActiveTab('document')}
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-300 group cursor-pointer relative overflow-hidden h-full
              ${activeTab === 'document'
                ? `${tabStyles.document.activeBorder} ${tabStyles.document.activeBg}`
                : `${tabStyles.document.inactiveBorder} ${tabStyles.document.inactiveBg}`
              }
            `}
          >
            {activeTab === 'document' && (
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl -mr-6 -mt-6 ${tabStyles.document.glow}`} />
            )}
            <div className={`p-2.5 rounded-lg transition-colors duration-300 shrink-0
              ${activeTab === 'document' ? tabStyles.document.activeIcon : tabStyles.document.inactiveIcon}
            `}>
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-foreground block">Document Templates</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-tight block">
                Root PDF layouts containing static tables and headers used by channels.
              </span>
            </div>
          </button>
        </div>

        {/* Vertical divider on desktop */}
        <div className="hidden lg:block w-px bg-border shrink-0 my-2" />

        {/* Level 2: Channels */}
        <div className="flex-1 flex flex-col space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Level 2: Delivery Channels</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-300 group cursor-pointer relative overflow-hidden
                  ${activeTab === tab.id
                    ? `${tabStyles[tab.id].activeBorder} ${tabStyles[tab.id].activeBg}`
                    : `${tabStyles[tab.id].inactiveBorder} ${tabStyles[tab.id].inactiveBg}`
                  }
                `}
              >
                {activeTab === tab.id && (
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl -mr-6 -mt-6 ${tabStyles[tab.id].glow}`} />
                )}
                <div className={`p-2.5 rounded-lg transition-colors duration-300 shrink-0
                  ${activeTab === tab.id ? tabStyles[tab.id].activeIcon : tabStyles[tab.id].inactiveIcon}
                `}>
                  {tab.icon}
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">{tab.label.replace(' Templates', '')} Templates</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-medium leading-tight block">
                    {tab.id === 'whatsapp' ? 'WhatsApp messaging' : 
                     tab.id === 'email' ? 'HTML emails & copies' :
                     tab.id === 'postal' ? 'Print & mail letters' : 'SMS notification texts'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render templates lists inside a structured container card */}
      <div className="bg-white dark:bg-card border border-border/60 p-6 rounded-2xl">
        <div className="space-y-4">

        {/* Document Templates */}
        {activeTab === 'document' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/20 border border-border/50 p-3 rounded-lg">
              <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
              <span>Document templates serve as core PDF layouts and can be linked inside WhatsApp, Email, Postal, or SMS notification templates. Click a card to edit it.</span>
            </div>
            {documentTemplates.length === 0 && !loading ? (
              <div className="p-8 text-center text-muted-foreground italic border border-border border-dashed rounded-xl">
                No document templates found. Click "New Template" to create one.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {documentTemplates.map((doc) => (
                  <CardWrapper
                    key={doc.id}
                    onClick={() => navigate(`/templates/edit/document/${doc.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-foreground text-base">{doc.templateName}</h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {doc.templateCode}
                          </code>
                          <button
                            onClick={(e) => handleCopyCode(e, doc.templateCode)}
                            className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors cursor-pointer"
                            title="Copy template code"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary rounded">
                          PDF
                        </span>
                        <button
                          onClick={(e) => handleDelete(e, 'document', doc.id)}
                          className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded transition-all cursor-pointer"
                          title="Delete template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                      <span>Version: {doc.version || 1}</span>
                      <span>{doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : 'Saved'}</span>
                    </div>
                  </CardWrapper>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WhatsApp Templates List */}
        {activeTab === 'whatsapp' && (
          <div className="grid gap-4 md:grid-cols-2">
            {whatsappTemplates.length === 0 && !loading ? (
              <div className="p-8 text-center text-muted-foreground italic border border-border border-dashed rounded-xl col-span-full">
                No WhatsApp templates found.
              </div>
            ) : (
              whatsappTemplates.map((template) => (
                <CardWrapper
                  key={template.id}
                  onClick={() => navigate(`/templates/edit/whatsapp/${template.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{template.templateName}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {template.templateCode}
                        </code>
                        <button
                          onClick={(e) => handleCopyCode(e, template.templateCode)}
                          className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors cursor-pointer"
                          title="Copy template code"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 rounded h-fit">
                        Active
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, 'whatsapp', template.id)}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded transition-all cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-accent/10 border border-border/40 rounded-lg text-xs">
                    <Link className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Linked Documents:</span>
                    {renderLinkedDocs(template.documentTemplates)}
                  </div>
                </CardWrapper>
              ))
            )}
          </div>
        )}

        {/* Email Templates List */}
        {activeTab === 'email' && (
          <div className="grid gap-4 md:grid-cols-2">
            {emailTemplates.length === 0 && !loading ? (
              <div className="p-8 text-center text-muted-foreground italic border border-border border-dashed rounded-xl col-span-full">
                No Email templates found.
              </div>
            ) : (
              emailTemplates.map((template) => (
                <CardWrapper
                  key={template.id}
                  onClick={() => navigate(`/templates/edit/email/${template.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{template.templateName}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {template.templateCode}
                        </code>
                        <button
                          onClick={(e) => handleCopyCode(e, template.templateCode)}
                          className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors cursor-pointer"
                          title="Copy template code"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Subject: {template.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 rounded h-fit">
                        Active
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, 'email', template.id)}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded transition-all cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-accent/10 border border-border/40 rounded-lg text-xs">
                    <Link className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Linked Documents:</span>
                    {renderLinkedDocs(template.documentTemplates)}
                  </div>
                </CardWrapper>
              ))
            )}
          </div>
        )}

        {/* Postal Templates List */}
        {activeTab === 'postal' && (
          <div className="grid gap-4 md:grid-cols-2">
            {postalTemplates.length === 0 && !loading ? (
              <div className="p-8 text-center text-muted-foreground italic border border-border border-dashed rounded-xl col-span-full">
                No Postal templates found.
              </div>
            ) : (
              postalTemplates.map((template) => (
                <CardWrapper
                  key={template.id}
                  onClick={() => navigate(`/templates/edit/postal/${template.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{template.templateName}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {template.templateCode}
                        </code>
                        <button
                          onClick={(e) => handleCopyCode(e, template.templateCode)}
                          className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors cursor-pointer"
                          title="Copy template code"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded h-fit
                        ${template.active
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                          : 'border-red-500/20 bg-red-500/10 text-red-500'
                        }
                      `}>
                        {template.active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, 'postal', template.id)}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded transition-all cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-accent/10 border border-border/40 rounded-lg text-xs">
                    <Link className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Linked Documents:</span>
                    {renderLinkedDocs(template.documentTemplates)}
                  </div>
                </CardWrapper>
              ))
            )}
          </div>
        )}

        {/* SMS Templates List */}
        {activeTab === 'sms' && (
          <div className="grid gap-4 md:grid-cols-2">
            {smsTemplates.length === 0 && !loading ? (
              <div className="p-8 text-center text-muted-foreground italic border border-border border-dashed rounded-xl col-span-full">
                No SMS templates found.
              </div>
            ) : (
              smsTemplates.map((template) => (
                <CardWrapper
                  key={template.id}
                  onClick={() => navigate(`/templates/edit/sms/${template.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{template.templateName}</h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {template.templateCode}
                        </code>
                        <button
                          onClick={(e) => handleCopyCode(e, template.templateCode)}
                          className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors cursor-pointer"
                          title="Copy template code"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 rounded h-fit">
                        Active
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, 'sms', template.id)}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded transition-all cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-accent/10 border border-border/40 rounded-lg text-xs">
                    <Link className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">Linked Documents:</span>
                    {renderLinkedDocs(template.documentTemplates)}
                  </div>
                </CardWrapper>
              ))
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Templates;
