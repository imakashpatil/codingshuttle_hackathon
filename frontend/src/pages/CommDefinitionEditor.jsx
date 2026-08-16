import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save, X, ArrowLeft, Layers, Trash2,
  ChevronDown, ChevronRight,
  MessageSquare, Mail, Landmark, Send, Code2, RefreshCw
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import { useToast } from '../components/Toast';

/* ─── channel metadata ──────────────────────────────────────────────────── */
const CHANNEL_META = {
  WHATSAPP: {
    label: 'WhatsApp',
    icon: () => <MessageSquare className="h-4 w-4 text-emerald-500" />,
    border: 'border-l-emerald-500',
    pill:   'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    badge:  'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  EMAIL: {
    label: 'Email',
    icon: () => <Mail className="h-4 w-4 text-blue-500" />,
    border: 'border-l-blue-500',
    pill:   'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20',
    badge:  'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  POSTAL: {
    label: 'Postal',
    icon: () => <Landmark className="h-4 w-4 text-amber-500" />,
    border: 'border-l-amber-500',
    pill:   'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20',
    badge:  'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  SMS: {
    label: 'SMS',
    icon: () => <Send className="h-4 w-4 text-purple-500" />,
    border: 'border-l-purple-500',
    pill:   'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20',
    badge:  'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
};

const ALL_CHANNELS = ['WHATSAPP', 'EMAIL', 'POSTAL', 'SMS'];

/* ─── component ─────────────────────────────────────────────────────────── */
const CommDefinitionEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toastSuccess, toastError, toastWarning } = useToast();

  /* form state */
  const [commCode, setCommCode]       = useState('');
  const [commName, setCommName]       = useState('');
  const [description, setDescription] = useState('');

  /* channels: [{ channel, enabled, templateId, priority }] */
  const [channels, setChannels] = useState([]);

  /* per-channel template lists fetched from API */
  const [templateLists, setTemplateLists] = useState({
    WHATSAPP: [], EMAIL: [], POSTAL: [], SMS: [],
  });
  const [templatesLoading, setTemplatesLoading] = useState(false);

  /* XML state */
  const [savedXmlSchema, setSavedXmlSchema]     = useState('');
  const [showSavedXml, setShowSavedXml]         = useState(true);

  /* UI state */
  const [expandedChannels, setExpandedChannels] = useState({});
  const [xmlPanelOpen, setXmlPanelOpen]         = useState(true);
  const [monacoTheme, setMonacoTheme]            = useState('vs-dark');

  /* ── Monaco theme sync ─────────────────────────────────────────────── */
  useEffect(() => {
    const updateTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      setMonacoTheme(isLight ? 'notifyhub-light' : 'notifyhub-dark');
    };
    updateTheme();
    const obs = new MutationObserver(updateTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('notifyhub-dark', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: { 'editor.background': '#101216' },
    });
    monaco.editor.defineTheme('notifyhub-light', {
      base: 'vs', inherit: true, rules: [],
      colors: { 'editor.background': '#ffffff' },
    });
  };

  /* ── Fetch all template lists ──────────────────────────────────────── */
  const fetchTemplateLists = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const [wa, em, po, sm] = await Promise.allSettled([
        axios.get(API_ENDPOINTS.TEMPLATES_WHATSAPP),
        axios.get(API_ENDPOINTS.TEMPLATES_EMAIL),
        axios.get(API_ENDPOINTS.TEMPLATES_POSTAL),
        axios.get(API_ENDPOINTS.TEMPLATES_SMS),
      ]);
      setTemplateLists({
        WHATSAPP: wa.status === 'fulfilled' ? (wa.value.data || []) : [],
        EMAIL:    em.status === 'fulfilled' ? (em.value.data || []) : [],
        POSTAL:   po.status === 'fulfilled' ? (po.value.data || []) : [],
        SMS:      sm.status === 'fulfilled' ? (sm.value.data || []) : [],
      });
    } catch (err) {
      console.error('Failed to load template lists:', err);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  /* ── Load definition ───────────────────────────────────────────────── */
  useEffect(() => {
    fetchTemplateLists();
    const load = async () => {
      if (id && id !== 'new') {
        try {
          const res = await axios.get(`${API_ENDPOINTS.COMMUNICATION_DEFINITIONS}/${id}`);
          const def = res.data;
          setCommCode(def.communicationCode || '');
          setCommName(def.name || '');
          setDescription(def.description || '');
          // Extract saved XML schema from payload.xmlSchema
          const xmlSchema = def.payload?.xmlSchema || def.xmlSchema || def.xmlPayload || '';
          setSavedXmlSchema(xmlSchema);
          setShowSavedXml(!!xmlSchema); // default to stored view if available
          const mapped = (def.channels || []).map(ch => ({
            channel:    ch.channel,
            enabled:    ch.enabled !== false,
            templateId: ch.templateId ? String(ch.templateId) : '',
            priority:   ch.priority || 1,
          }));
          setChannels(mapped);
        } catch (err) {
          console.error('Failed to load communication definition:', err);
        }
      } else {
        setCommCode('new_communication_trigger');
        setCommName('New Communication Definition');
        setDescription('Consolidated trigger for billing notification.');
        setChannels([]);
      }
    };
    load();
  }, [id, fetchTemplateLists]);

  /* ── XML payload generation ────────────────────────────────────────── */
  const generateConsolidatedXml = useCallback((currentChannels) => {
    const parseFields = (xmlString) => {
      if (!xmlString) return [];
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        if (xmlDoc.documentElement && xmlDoc.documentElement.tagName !== 'parsererror') {
          return Array.from(xmlDoc.documentElement.children).map(c => c.outerHTML);
        }
      } catch (_) { /* ignore */ }
      return [];
    };

    const fieldMap = new Map();
    currentChannels.forEach(ch => {
      if (!ch.enabled || !ch.templateId) return;
      const list = templateLists[ch.channel] || [];
      const tpl  = list.find(t => String(t.id) === String(ch.templateId));
      if (!tpl?.xmlPayloadFormat) return;
      parseFields(tpl.xmlPayloadFormat).forEach(fieldStr => {
        const match = fieldStr.match(/^<([a-zA-Z0-9_-]+)/);
        if (match) fieldMap.set(match[1], fieldStr);
      });
    });

    if (fieldMap.size === 0) {
      return '<!-- Select templates above to generate the consolidated XML payload schema -->';
    }
    const fields = Array.from(fieldMap.values()).map(f => `  ${f}`).join('\n');
    return `<communication>\n${fields}\n</communication>`;
  }, [templateLists]);

  const xmlPayload = generateConsolidatedXml(channels);

  /* ── Channel actions ───────────────────────────────────────────────── */
  const handleAddChannel = (channelName) => {
    if (channels.some(c => c.channel === channelName)) return;
    setChannels(prev => [...prev, { channel: channelName, enabled: true, templateId: '', priority: 1 }]);
    setExpandedChannels(prev => ({ ...prev, [channelName]: true }));
  };

  const handleRemoveChannel = (channelName) => {
    setChannels(prev => prev.filter(c => c.channel !== channelName));
    setExpandedChannels(prev => { const n = { ...prev }; delete n[channelName]; return n; });
  };

  const handleTemplateSelect = (channelName, templateId) => {
    // store as trimmed string; empty string means "none selected"
    setChannels(prev => prev.map(c =>
      c.channel === channelName ? { ...c, templateId: templateId.trim() } : c
    ));
  };

  const toggleExpand = (channelName) => {
    setExpandedChannels(prev => ({ ...prev, [channelName]: !prev[channelName] }));
  };

  /* ── Save ──────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!commCode || !commName) {
      toastWarning('Required Fields Missing', 'Communication Code and Name are required.');
      return;
    }
    const isEdit = id && id !== 'new';
    const payload = {
      communicationCode: commCode,
      name: commName,
      description,
      channels: channels
        .filter(c => c.enabled)
        .map(c => ({
          channel:    c.channel,
          enabled:    c.enabled,
          templateId: (c.templateId && c.templateId.trim() !== '') ? c.templateId.trim() : null,
          priority:   c.priority || 1,
        })),
    };
    try {
      if (isEdit) {
        await axios.put(`${API_ENDPOINTS.COMMUNICATION_DEFINITIONS}/${id}`, payload);
      } else {
        await axios.post(API_ENDPOINTS.COMMUNICATION_DEFINITIONS, payload);
      }
      toastSuccess('Definition Saved', `"${commName}" was ${isEdit ? 'updated' : 'created'} successfully.`);
      navigate('/comm-definitions');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Service unreachable.';
      toastError('Save Failed', msg);
    }
  };

  /* ── derived ───────────────────────────────────────────────────────── */
  const activeChannelNames = channels.map(c => c.channel);
  const availableToAdd     = ALL_CHANNELS.filter(ch => !activeChannelNames.includes(ch));

  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] border border-border rounded-xl bg-card overflow-hidden">

      {/* ── Header Row ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center h-12 px-4 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/comm-definitions')}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xs font-bold text-foreground tracking-tight leading-none">
              {id === 'new' || !id ? 'Create Communication Definition' : 'Edit Communication Definition'}
            </h1>
            <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">
              Bind delivery channel templates into single transaction routing definitions.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/comm-definitions')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border text-foreground hover:bg-muted font-semibold rounded text-xs transition-all cursor-pointer h-8"
          >
            <X className="h-3.5 w-3.5" /><span>Cancel</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded text-xs transition-all cursor-pointer h-8 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" /><span>Save Definition</span>
          </button>
        </div>
      </div>

      {/* ── Metadata Row ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-muted/5 border-b border-border/80 shrink-0">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
            Communication Code
          </label>
          <input
            type="text" value={commCode}
            onChange={e => setCommCode(e.target.value)}
            placeholder="e.g. billing_trigger"
            className="px-3 py-1 bg-background border border-border rounded text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-64 h-8"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
            Definition Name
          </label>
          <input
            type="text" value={commName}
            onChange={e => setCommName(e.target.value)}
            placeholder="e.g. Account Billing Triggers"
            className="px-3 py-1 bg-background border border-border rounded text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-72 h-8"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
            Description
          </label>
          <input
            type="text" value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Provide a description of the trigger..."
            className="px-3 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
          />
        </div>
      </div>

      {/* ── Main Body: two-column layout ───────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Delivery Channels config */}
        <div className="flex flex-col flex-1 overflow-hidden border-r border-border">

          {/* Section header */}
          <div className="flex items-center justify-between h-10 px-4 border-b border-border bg-muted/10 shrink-0">
            <span className="text-xs font-bold text-foreground">Delivery Channels</span>
            <button
              onClick={fetchTemplateLists}
              disabled={templatesLoading}
              title="Refresh template lists"
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${templatesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Add-route pills */}
          <div className="flex flex-wrap items-center gap-2.5 px-5 py-2.5 border-b border-border bg-muted/5 shrink-0 select-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Add Route:</span>
            {availableToAdd.map(ch => {
              const meta = CHANNEL_META[ch];
              return (
                <button
                  key={ch}
                  onClick={() => handleAddChannel(ch)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer border ${meta.pill}`}
                >
                  + {meta.label.toUpperCase()}
                </button>
              );
            })}
            {availableToAdd.length === 0 && (
              <span className="text-[10px] text-slate-500 italic">All delivery channels mapped.</span>
            )}
          </div>

          {/* Channels list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {channels.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground italic border border-border/80 border-dashed rounded-lg mt-2">
                No delivery channels added yet. Use the <strong>Add Route</strong> buttons above.
              </div>
            ) : (
              channels.map(ch => {
                const meta        = CHANNEL_META[ch.channel];
                const isExpanded  = expandedChannels[ch.channel];
                const tplList     = templateLists[ch.channel] || [];
                const selectedTpl = tplList.find(t => String(t.id) === String(ch.templateId));

                return (
                  <div
                    key={ch.channel}
                    className={`bg-card border border-border/80 rounded-lg overflow-hidden transition-all border-l-[4px] ${meta.border}`}
                  >
                    {/* Channel row header — click to expand */}
                    <div
                      className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                      onClick={() => toggleExpand(ch.channel)}
                    >
                      <div className="flex items-center gap-2.5">
                        {isExpanded
                          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                        {meta.icon()}
                        <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                          {ch.channel} Channel
                        </span>
                        {selectedTpl && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${meta.badge}`}>
                            {selectedTpl.templateName || selectedTpl.templateCode}
                          </span>
                        )}
                        {!selectedTpl && (
                          <span className="text-[9px] text-amber-500 font-semibold italic">
                            — no template selected
                          </span>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleRemoveChannel(ch.channel); }}
                        className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded transition-colors cursor-pointer shrink-0"
                        title="Remove Route"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Expanded: template selector */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-muted/10 space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                            Select Template
                          </label>
                          {tplList.length === 0 ? (
                            <div className="text-[10px] text-amber-500 italic px-1">
                              {templatesLoading
                                ? 'Loading templates…'
                                : `No ${meta.label} templates found. Create one in Templates first.`}
                            </div>
                          ) : (
                            <select
                              value={ch.templateId || ''}
                              onChange={e => handleTemplateSelect(ch.channel, e.target.value)}
                              className="px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full h-8 cursor-pointer"
                            >
                              <option value="">— Choose a {meta.label} template —</option>
                              {tplList.map(t => (
                                <option key={t.id} value={String(t.id)}>
                                  {t.templateName || t.templateCode} ({t.templateCode})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Selected template metadata card */}
                        {selectedTpl && (
                          <div className="rounded-lg border border-border/60 bg-background p-3 space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <span className="font-bold text-foreground">{selectedTpl.templateName}</span>
                              <span>·</span>
                              <code className="font-mono bg-muted px-1 rounded">{selectedTpl.templateCode}</code>
                            </div>
                            {selectedTpl.xmlPayloadFormat && (
                              <div className="text-[9px] text-muted-foreground">
                                XML fields:{' '}
                                <span className="font-semibold text-foreground">
                                  {(() => {
                                    try {
                                      const parser = new DOMParser();
                                      const doc = parser.parseFromString(selectedTpl.xmlPayloadFormat, 'text/xml');
                                      return Array.from(doc.documentElement?.children || [])
                                        .map(c => `<${c.tagName}>`)
                                        .join(', ') || '—';
                                    } catch { return '—'; }
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT — XML Payload Preview panel */}
        <div className="flex flex-col w-[380px] shrink-0 overflow-hidden">
          {/* XML panel header */}
          <div
            className="flex items-center justify-between h-10 px-4 border-b border-border bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors select-none shrink-0"
            onClick={() => setXmlPanelOpen(p => !p)}
          >
            <div className="flex items-center gap-2">
              <Code2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">Consolidated XML Payload</span>
            </div>
            {xmlPanelOpen
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </div>

          {xmlPanelOpen && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Toggle strip — only shown in edit mode when a stored schema exists */}
              {savedXmlSchema && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/5 shrink-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mr-1">View:</span>
                  <button
                    onClick={() => setShowSavedXml(true)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                      showSavedXml
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Stored Schema
                  </button>
                  <button
                    onClick={() => setShowSavedXml(false)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                      !showSavedXml
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Live Generated
                  </button>
                </div>
              )}

              {/* Info strip */}
              <div className="px-4 py-1.5 border-b border-border/50 bg-muted/5 shrink-0">
                <p className="text-[9px] text-muted-foreground leading-snug">
                  {savedXmlSchema && showSavedXml
                    ? 'Stored XML schema returned by the server from payload.xmlSchema.'
                    : 'Auto-generated by merging XML schemas of all selected channel templates. Duplicates de-duplicated.'}
                </p>
              </div>

              {/* Monaco editor (read-only) */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  language="xml"
                  value={(savedXmlSchema && showSavedXml) ? savedXmlSchema : xmlPayload}
                  theme={monacoTheme}
                  beforeMount={handleEditorWillMount}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 11,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    padding: { top: 10, bottom: 10 },
                    renderLineHighlight: 'none',
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    scrollbar: { vertical: 'auto', horizontal: 'hidden' },
                    folding: false,
                    contextmenu: false,
                  }}
                />
              </div>

              {/* Field count footer */}
              <div className="px-4 py-1.5 border-t border-border/50 bg-muted/5 shrink-0">
                <span className="text-[9px] text-muted-foreground">
                  {(() => {
                    const xml = (savedXmlSchema && showSavedXml) ? savedXmlSchema : xmlPayload;
                    try {
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(xml, 'text/xml');
                      const count = doc.documentElement?.children?.length || 0;
                      return count > 0
                        ? `${count} unique field${count !== 1 ? 's' : ''} in schema`
                        : 'No fields yet — select templates to populate';
                    } catch { return '—'; }
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CommDefinitionEditor;
