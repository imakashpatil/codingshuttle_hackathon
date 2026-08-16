import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Eye, Play, FileText, ArrowLeft, Link as LinkIcon, HelpCircle, Info } from 'lucide-react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import { useToast } from '../components/Toast';


const TemplateEditor = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { toastSuccess, toastError, toastWarning } = useToast();

  // Common metadata
  const [templateName, setTemplateName] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [xmlPayloadFormat, setXmlPayloadFormat] = useState('');

  // Editor-specific states
  const [htmlContent, setHtmlContent] = useState('');
  const [cssContent, setCssContent] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [senderId, setSenderId] = useState('');
  const [linkedDocIds, setLinkedDocIds] = useState([]);

  // UI States
  const [activeEditorTab, setActiveEditorTab] = useState('html');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [allDocTemplates, setAllDocTemplates] = useState([]);

  // Monaco theme configuration
  const [monacoTheme, setMonacoTheme] = useState('vs-dark');

  // Dynamic theme listener for Monaco Editor
  useEffect(() => {
    const updateTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      setMonacoTheme(isLight ? 'notifyhub-light' : 'notifyhub-dark');
    };

    updateTheme(); // Initial check

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Monaco custom theme registration on editor launch
  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('notifyhub-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#101216', // Lighter shade than the absolute black background
      }
    });
    monaco.editor.defineTheme('notifyhub-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
      }
    });
  };

  // Load configuration from REST API
  useEffect(() => {
    const fetchData = async () => {
      // Always load all document templates for the link picker
      try {
        const docsRes = await axios.get(API_ENDPOINTS.TEMPLATES_DOCUMENTS);
        setAllDocTemplates(docsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch document templates.', err);
        setAllDocTemplates([]);
      }

      // If editing existing template, fetch it by ID
      if (id && id !== 'new') {
        const endpointMap = {
          document: API_ENDPOINTS.TEMPLATES_DOCUMENTS,
          whatsapp: API_ENDPOINTS.TEMPLATES_WHATSAPP,
          email: API_ENDPOINTS.TEMPLATES_EMAIL,
          sms: API_ENDPOINTS.TEMPLATES_SMS,
          postal: API_ENDPOINTS.TEMPLATES_POSTAL,
        };
        try {
          const res = await axios.get(`${endpointMap[type]}/${id}`);
          const t = res.data;
          setTemplateName(t.templateName || '');
          setTemplateCode(t.templateCode || '');
          setXmlPayloadFormat(t.xmlPayloadFormat || '');
          // Extract template IDs from documentTemplates list
          setLinkedDocIds((t.documentTemplates || []).map(doc => String(doc.id)));

          if (type === 'document') {
            setHtmlContent(t.htmlContent || '<div></div>');
            setCssContent(t.cssContent || '');
            setActiveEditorTab('html');
          } else if (type === 'email') {
            setHtmlContent(t.htmlContent || '<div></div>');
            setCssContent(t.cssContent || '');
            setSubject(t.subject || '');
            setActiveEditorTab('html');
          } else if (type === 'whatsapp' || type === 'sms') {
            setMessage(t.message || '');
            setActiveEditorTab('message');
          } else if (type === 'postal') {
            setActiveEditorTab('docs');
          }
        } catch (err) {
          console.error('Failed to load template by ID.', err);
        }
      } else {
        // New template defaults
        setTemplateName(`New ${type.toUpperCase()} Template`);
        setTemplateCode(`new_${type}_template`);
        setLinkedDocIds([]);

        if (type === 'document') {
          setHtmlContent('<div class="page">\n  <h1>Document Header</h1>\n  <p>Hello {{customerName}}</p>\n</div>');
          setCssContent('.page { font-family: sans-serif; }\nh1 { color: #1e5df6; }');
          setXmlPayloadFormat('<document>\n  <customerName>John Doe</customerName>\n</document>');
          setActiveEditorTab('html');
        } else if (type === 'email') {
          setSubject('Billing Notification for {{customerName}}');
          setHtmlContent('<h2>Hello {{customerName}}</h2>\n<p>Your monthly billing layout is attached below.</p>');
          setCssContent('h2 { color: #1e5df6; }');
          setXmlPayloadFormat('<document>\n  <customerName>John Doe</customerName>\n</document>');
          setActiveEditorTab('html');
        } else if (type === 'whatsapp') {
          setMessage('Hello {{customerName}},\n\nYour payment of {{amount}} is processed.');
          setXmlPayloadFormat('<document>\n  <customerName>John Doe</customerName>\n  <amount>$200.00</amount>\n</document>');
          setActiveEditorTab('message');
        } else if (type === 'sms') {
          setMessage('Hi {{customerName}}, OTP code: {{otp}}');
          setXmlPayloadFormat('<document>\n  <customerName>John Doe</customerName>\n  <otp>849021</otp>\n</document>');
          setActiveEditorTab('message');
        } else if (type === 'postal') {
          setActiveEditorTab('docs');
        }
      }
    };
    fetchData();
  }, [type, id]);

  const handleSave = async () => {
    if (!templateName || !templateCode) {
      toastWarning('Required Fields Missing', 'Template Name and Code are required.');
      return;
    }

    const endpointMap = {
      document: API_ENDPOINTS.TEMPLATES_DOCUMENTS,
      whatsapp: API_ENDPOINTS.TEMPLATES_WHATSAPP,
      email: API_ENDPOINTS.TEMPLATES_EMAIL,
      sms: API_ENDPOINTS.TEMPLATES_SMS,
      postal: API_ENDPOINTS.TEMPLATES_POSTAL,
    };
    const endpoint = endpointMap[type];
    const isEdit = id && id !== 'new';

    // Build request payload matching exact DTO field names
    const payload = { templateCode, templateName, xmlPayloadFormat };

    if (type === 'document') {
      payload.htmlContent = htmlContent;
      payload.cssContent = cssContent;
    } else if (type === 'email') {
      payload.htmlContent = htmlContent;
      payload.cssContent = cssContent;
      payload.subject = subject;
      payload.documentTemplateIds = linkedDocIds;
    } else if (type === 'whatsapp') {
      payload.message = message;
      payload.documentTemplateIds = linkedDocIds;
    } else if (type === 'sms') {
      payload.message = message;
      payload.documentTemplateIds = linkedDocIds;
    } else if (type === 'postal') {
      payload.documentTemplateIds = linkedDocIds;
      payload.active = true;
      // postal has no xmlPayloadFormat, remove it
      delete payload.xmlPayloadFormat;
    }

    try {
      if (isEdit) {
        await axios.put(`${endpoint}/${id}`, payload);
      } else {
        await axios.post(endpoint, payload);
      }
      toastSuccess('Template Saved', `"${templateName}" was ${isEdit ? 'updated' : 'created'} successfully.`);
      navigate('/templates');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Service unreachable.';
      toastError('Save Failed', msg);
    }
  };

  // Convert XML variables parsing helper
  const parseXMLToContext = (xmlString) => {
    if (!xmlString || !xmlString.trim()) return {};
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      if (xmlDoc.getElementsByTagName("parsererror").length > 0 || !xmlDoc.documentElement) {
        return null;
      }
      
      const xmlToJson = (xmlNode) => {
        if (xmlNode.nodeType === 3) return xmlNode.nodeValue.trim();
        if (xmlNode.nodeType === 1) {
          if (xmlNode.childNodes.length === 0) return "";
          if (xmlNode.childNodes.length === 1 && xmlNode.firstChild.nodeType === 3) {
            return xmlNode.firstChild.nodeValue.trim();
          }
          const obj = {};
          for (let i = 0; i < xmlNode.childNodes.length; i++) {
            const child = xmlNode.childNodes[i];
            if (child.nodeType === 1) {
              const childVal = xmlToJson(child);
              const name = child.nodeName;
              if (obj[name] !== undefined) {
                if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
                obj[name].push(childVal);
              } else {
                obj[name] = childVal;
              }
            }
          }
          return obj;
        }
        return null;
      };

      let context = xmlToJson(xmlDoc.documentElement);
      if (context && typeof context === 'object') {
        const simplify = (obj) => {
          if (typeof obj !== 'object' || obj === null) return obj;
          const keys = Object.keys(obj);
          keys.forEach(k => { simplify(obj[k]); });
          if (keys.length === 1 && Array.isArray(obj[keys[0]])) return obj[keys[0]];
          return obj;
        };
        context = simplify(context);
      }
      return context;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Handlebars resolver
  const compileHandlebars = (template, context) => {
    let output = template;
    const resolvePath = (obj, path) => {
      if (!obj) return undefined;
      const parts = path.replace(/\//g, '.').split('.');
      let current = obj;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
      }
      return current;
    };

    // {{#eachPage path size=N}}
    const eachPageRegex = /\{\{#eachPage\s+([a-zA-Z0-9_\.\/]+)\s+size=(\d+)\}\}([\s\S]*?)\{\{\/eachPage\}\}/g;
    output = output.replace(eachPageRegex, (match, path, sizeStr, innerTemplate) => {
      const list = resolvePath(context, path);
      if (!Array.isArray(list)) return "";
      const size = parseInt(sizeStr, 10) || 5;
      const chunks = [];
      for (let i = 0; i < list.length; i += size) {
        chunks.push(list.slice(i, i + size));
      }
      return chunks.map((chunk, idx) => {
        const pageContext = {
          ...context,
          thisPageItems: chunk,
          pageNumber: idx + 1,
          totalPages: chunks.length,
          isLastPage: idx === chunks.length - 1
        };
        return compileHandlebars(innerTemplate, pageContext);
      }).join('');
    });

    // {{#each path}}
    const eachRegex = /\{\{#each\s+([a-zA-Z0-9_\.\/]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    output = output.replace(eachRegex, (match, path, innerTemplate) => {
      const list = resolvePath(context, path);
      if (!Array.isArray(list)) return "";
      return list.map(item => {
        const itemContext = typeof item === 'object' ? { ...context, ...item } : { ...context, this: item };
        return compileHandlebars(innerTemplate, itemContext);
      }).join('');
    });

    // {{#if path}}
    const ifRegex = /\{\{#if\s+([a-zA-Z0-9_\.\/]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
    output = output.replace(ifRegex, (match, path, truthyTemplate, falseyTemplate = "") => {
      const val = resolvePath(context, path);
      if (val) {
        return compileHandlebars(truthyTemplate, context);
      } else {
        return compileHandlebars(falseyTemplate, context);
      }
    });

    // Variable interpolation
    const varRegex = /\{\{([a-zA-Z0-9_\.\/]+)\}\}/g;
    output = output.replace(varRegex, (match, path) => {
      const val = resolvePath(context, path);
      return val !== undefined ? String(val) : match;
    });

    return output;
  };

  const handleRenderPreview = () => {
    const isLight = document.documentElement.classList.contains('light');

    if (type === 'document') {
      const context = parseXMLToContext(xmlPayloadFormat);
      const baseStyle = `
        body { margin: 0; padding: 0; background-color: #ffffff; }
        @media screen {
          body { display: flex; flex-direction: column; align-items: center; gap: 30px; padding: 40px 0; }
          .page {
            width: 210mm; min-height: 297mm; background: #ffffff;
            box-shadow: none;
            border: 1px solid #cbd5e1;
            box-sizing: border-box; padding: 20mm; position: relative;
          }
        }
      `;
      setPreviewHtml(`<!DOCTYPE html><html><head><style>${baseStyle}\n${cssContent}</style></head><body>${compileHandlebars(htmlContent, context)}</body></html>`);
    } 
    else if (type === 'email') {
      const context = parseXMLToContext(xmlPayloadFormat);
      const compiledSubject = compileHandlebars(subject, context);
      const compiledBody = compileHandlebars(htmlContent, context);
      
      const emailContainer = `
        <div style="font-family: sans-serif; background-color: #ffffff; color: #0f172a; padding: 25px; border-radius: 8px; border: 1px solid #cbd5e1; max-width: 620px; margin: 20px auto; box-shadow: none;">
          <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
            <p style="margin: 4px 0;"><span style="color: #64748b;">From:</span> billing@notifyhub.com</p>
            <p style="margin: 4px 0;"><span style="color: #64748b;">Subject:</span> <strong>${compiledSubject}</strong></p>
            ${linkedDocIds.length > 0 ? `
              <div style="margin-top: 12px; padding: 8px 12px; background-color: #f8fafc; border-radius: 6px; display: flex; align-items: center; gap: 8px; border: 1px solid #cbd5e1;">
                <span style="color: #ef4444; font-weight: bold;">📄</span>
                <span style="font-size: 12px; color: #0f172a;">
                  <strong>Attachments:</strong> ${linkedDocIds.map(docId => allDocTemplates.find(d => d.id === docId)?.name || docId).join(', ')}
                </span>
              </div>
            ` : ''}
          </div>
          <style>${cssContent}</style>
          <div style="line-height: 1.5; font-size: 14px;">${compiledBody}</div>
        </div>
      `;
      setPreviewHtml(`<!DOCTYPE html><html><body style="background-color: #ffffff; margin: 0; padding: 20px;">${emailContainer}</body></html>`);
    }
    else if (type === 'whatsapp') {
      const context = parseXMLToContext(xmlPayloadFormat);
      let compiledMsg = compileHandlebars(message, context);
      compiledMsg = compiledMsg
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/~(.*?)~/g, '<del>$1</del>')
        .replace(/\n/g, '<br/>');

      const waBubble = `
        <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #ffffff;">
          <div style="width: 330px; background-color: #ffffff; color: #111b21; padding: 14px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: none; font-size: 14px; line-height: 1.5; position: relative;">
            ${linkedDocIds.length > 0 ? `
              <div style="background-color: #f0f2f5; border-radius: 6px; padding: 10px; display: flex; align-items: center; gap: 10px; margin-bottom: 12px; border-left: 4px solid #00a884;">
                <span style="font-size: 22px;">📄</span>
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; flex: 1;">
                  <strong style="display:block; color: #111b21;">${allDocTemplates.find(d => d.id === linkedDocIds[0])?.name || 'Linked Attachment'}</strong>
                  <span style="color: #8696a0;">PDF Document</span>
                </div>
              </div>
            ` : ''}
            <div style="word-break: break-word;">${compiledMsg}</div>
            <div style="text-align: right; font-size: 10px; color: #8696a0; margin-top: 4px;">12:00 PM ✓✓</div>
          </div>
        </div>
      `;
      setPreviewHtml(`<!DOCTYPE html><html style="margin:0;padding:0;"><body style="margin:0;padding:0;">${waBubble}</body></html>`);
    }
    else if (type === 'sms') {
      const context = parseXMLToContext(xmlPayloadFormat);
      let compiledMsg = compileHandlebars(message, context);
      if (linkedDocIds.length > 0) {
        const docCode = allDocTemplates.find(d => d.id === linkedDocIds[0])?.code || 'doc';
        compiledMsg += `\n\nDownload: https://nthub.co/d/${docCode}`;
      }
      
      const smsBubble = `
        <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #ffffff;">
          <div style="width: 290px; background-color: #e9e9eb; color: #000000; padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.4; box-shadow: none; border: 1px solid #cbd5e1;">
            <div style="word-break: break-word; white-space: pre-wrap;">${compiledMsg}</div>
          </div>
        </div>
      `;
      setPreviewHtml(`<!DOCTYPE html><html style="margin:0;padding:0;"><body style="margin:0;padding:0;">${smsBubble}</body></html>`);
    }
    else if (type === 'postal') {
      const postalLabel = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 30px; box-shadow: none; color: #0f172a;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
              <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Sender</p>
              <p style="margin: 3px 0 0 0; font-size: 12px; font-weight: bold; color: #475569;">NotifyHub Mail Depot</p>
            </div>
            <div style="border: 2px solid #ef4444; color: #ef4444; padding: 4px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; transform: rotate(-5deg); border-radius: 4px;">
              POST DISPATCH
            </div>
          </div>
          
          <div style="margin-top: 40px; margin-left: 60px;">
            <p style="margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Mail Recipient Address</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold;">NotifyHub Customer Address</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #475569;">Billed documents attached: ${linkedDocIds.map(docId => allDocTemplates.find(d => d.id === docId)?.name || docId).join(', ') || 'None'}</p>
          </div>
        </div>
      `;
      setPreviewHtml(`<!DOCTYPE html><html><body style="background-color: #ffffff; margin:0; padding:20px;">${postalLabel}</body></html>`);
    }

    setShowFullPreview(true);
  };

  const handleDocCheckboxChange = (docId) => {
    if (linkedDocIds.includes(docId)) {
      setLinkedDocIds(linkedDocIds.filter(id => id !== docId));
    } else {
      setLinkedDocIds([...linkedDocIds, docId]);
    }
  };

  // Full screen preview rendering template
  if (showFullPreview) {
    return (
      <div className="fixed inset-0 bg-[#ffffff] dark:bg-[#0f172a] z-[2500] flex flex-col overflow-hidden animate-in fade-in duration-200">
        <div className="flex justify-between items-center px-6 py-3 border-b border-border bg-card shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="font-bold text-xs uppercase tracking-wider text-foreground">{type.toUpperCase()} Mock Render Preview</span>
          </div>
          <button 
            onClick={() => setShowFullPreview(false)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 text-white hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold rounded-lg shadow-md cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Close Preview</span>
          </button>
        </div>
        <div className="flex-1 bg-[#ffffff] dark:bg-[#090a0f] p-8 overflow-auto flex justify-center">
          <iframe
            title="live-render-full"
            srcDoc={previewHtml}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] border border-border rounded-xl bg-card overflow-hidden relative">
      {/* Header Panel (Row 1) */}
      <div className="flex justify-between items-center h-12 px-4 border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/templates')} 
            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xs font-bold text-foreground tracking-tight leading-none">
              {id === 'new' || id === undefined ? `Create ${type.toUpperCase()} Template` : `Edit ${type.toUpperCase()} Template`}
            </h1>
            <span className="text-[9px] text-muted-foreground mt-0.5 leading-none">Configure delivery channel parameters and map attachment document schemas.</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowDocumentation(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold rounded text-xs transition-all cursor-pointer h-8"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Syntax Guide</span>
          </button>
          
          {type !== 'postal' && (
            <button 
              onClick={handleRenderPreview}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent/80 text-accent-foreground border border-primary/20 font-semibold rounded text-xs transition-all cursor-pointer h-8 shadow-sm"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Run Preview</span>
            </button>
          )}

          <button 
            onClick={() => navigate('/templates')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border text-foreground hover:bg-muted font-semibold rounded text-xs transition-all cursor-pointer h-8"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </button>

          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded text-xs transition-all cursor-pointer h-8 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {/* Configuration Fields (Row 2) */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-muted/5 border-b border-border/80 shrink-0">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Template Name</label>
          <input 
            type="text" 
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Display Name"
            className="px-3 py-1 bg-background border border-border rounded text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-64 h-8"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Template Code</label>
          <input 
            type="text" 
            value={templateCode}
            onChange={(e) => setTemplateCode(e.target.value)}
            placeholder="template_code"
            className="px-3 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 h-8"
          />
        </div>

        {/* Email Subject Line */}
        {type === 'email' && (
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Subject Line</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Statement Notification for {{customerName}}"
              className="px-3 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
            />
          </div>
        )}

        {/* SMS Sender ID */}
        {type === 'sms' && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">SMS Sender ID</label>
            <input 
              type="text" 
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="e.g. NTSEND"
              className="px-3 py-1 bg-background border border-border rounded text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-32 h-8"
            />
          </div>
        )}
      </div>

      {/* Main Split Screen Area or Full Width for Postal */}
      {type === 'postal' ? (
        <div className="flex-1 overflow-y-auto p-6 bg-card flex justify-center">
          <div className="max-w-3xl w-full space-y-6">
            <div className="flex items-start gap-2.5 p-3.5 bg-accent/15 border border-border/50 rounded-lg text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground block mb-0.5">Physical Post Dispatch Configuration</span>
                Postal templates are printed physically at the post depot and sent. Link the PDF Document templates below that will compile and print for delivery.
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-primary" />
                <span>Link Document PDF Templates to Print</span>
              </h4>
              <div className="border border-border rounded-lg bg-card divide-y divide-border overflow-hidden">
                {allDocTemplates.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground italic text-center">No document templates available to link. Create one first!</div>
                ) : (
                  allDocTemplates.map((doc) => (
                    <label key={doc.id} className="flex items-center justify-between p-3.5 hover:bg-muted/30 cursor-pointer select-none">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={linkedDocIds.includes(doc.id)}
                          onChange={() => handleDocCheckboxChange(doc.id)}
                          className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-foreground block">{doc.templateName}</span>
                          <code className="text-[10px] font-mono text-muted-foreground">{doc.templateCode}</code>
                        </div>
                      </div>
                      <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">PDF</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden divide-x divide-border">
          {/* LEFT PANE: Editor Code & Link Configs */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {/* Header Tab Bar matched to height h-10 (40px) */}
            <div className="flex items-center h-10 border-b border-border bg-muted/10 shrink-0 overflow-x-auto">
              {type === 'document' && (
                <>
                  <button onClick={() => setActiveEditorTab('html')} className={`h-full px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${activeEditorTab === 'html' ? 'border-primary text-primary bg-background/50' : 'border-transparent text-muted-foreground'}`}>HTML Content</button>
                  <button onClick={() => setActiveEditorTab('css')} className={`h-full px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${activeEditorTab === 'css' ? 'border-primary text-primary bg-background/50' : 'border-transparent text-muted-foreground'}`}>CSS Styles</button>
                </>
              )}

              {type === 'email' && (
                <>
                  <button onClick={() => setActiveEditorTab('html')} className={`h-full px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${activeEditorTab === 'html' ? 'border-primary text-primary bg-background/50' : 'border-transparent text-muted-foreground'}`}>Email body (HTML)</button>
                  <button onClick={() => setActiveEditorTab('css')} className={`h-full px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${activeEditorTab === 'css' ? 'border-primary text-primary bg-background/50' : 'border-transparent text-muted-foreground'}`}>Email CSS Styles</button>
                  <button onClick={() => setActiveEditorTab('docs')} className={`h-full px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${activeEditorTab === 'docs' ? 'border-primary text-primary bg-background/50' : 'border-transparent text-muted-foreground'}`}>Attach PDF Documents ({linkedDocIds.length})</button>
                </>
              )}

              {(type === 'whatsapp' || type === 'sms') && (
                <>
                  <button onClick={() => setActiveEditorTab('message')} className={`h-full px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${activeEditorTab === 'message' ? 'border-primary text-primary bg-background/50' : 'border-transparent text-muted-foreground'}`}>Message Content</button>
                  <button onClick={() => setActiveEditorTab('docs')} className={`h-full px-4 text-xs font-bold border-b-2 cursor-pointer transition-all ${activeEditorTab === 'docs' ? 'border-primary text-primary bg-background/50' : 'border-transparent text-muted-foreground'}`}>Attach PDF Documents ({linkedDocIds.length})</button>
                </>
              )}
            </div>

            {/* Editors Container */}
            <div className="flex-1 overflow-hidden relative">
              {activeEditorTab === 'html' && (
                <Editor
                  height="100%"
                  width="100%"
                  language="html"
                  theme={monacoTheme}
                  value={htmlContent}
                  onChange={(val) => setHtmlContent(val || '')}
                  beforeMount={handleEditorWillMount}
                  options={{ minimap: { enabled: false }, fontSize: 12 }}
                />
              )}

              {activeEditorTab === 'css' && (
                <Editor
                  height="100%"
                  width="100%"
                  language="css"
                  theme={monacoTheme}
                  value={cssContent}
                  onChange={(val) => setCssContent(val || '')}
                  beforeMount={handleEditorWillMount}
                  options={{ minimap: { enabled: false }, fontSize: 12 }}
                />
              )}

              {activeEditorTab === 'message' && (
                <div className="h-full flex flex-col bg-card relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 w-full p-6 bg-transparent text-foreground font-mono text-sm border-0 focus:outline-none resize-none"
                    placeholder={`Hello {{customerName}},\n\nYour payment is due.`}
                  />
                </div>
              )}

              {activeEditorTab === 'docs' && (
                <div className="h-full p-4 overflow-y-auto space-y-4 bg-card">
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      <span>Link Document PDF Templates</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Select the child document layout PDF files to send alongside this notification flow.</p>
                  </div>

                  <div className="border border-border rounded-lg bg-card divide-y divide-border overflow-hidden">
                    {allDocTemplates.length === 0 ? (
                      <div className="p-4 text-xs text-muted-foreground italic text-center">No document templates available to link. Create one first!</div>
                    ) : (
                      allDocTemplates.map((doc) => (
                        <label key={doc.id} className="flex items-center justify-between p-3.5 hover:bg-muted/30 cursor-pointer select-none">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={linkedDocIds.includes(String(doc.id))}
                              onChange={() => handleDocCheckboxChange(String(doc.id))}
                              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold text-foreground block">{doc.templateName}</span>
                              <code className="text-[10px] font-mono text-muted-foreground">{doc.templateCode}</code>
                            </div>
                          </div>
                          <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">PDF</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: XML Payload Format Schema */}
          <div className="w-1/2 flex flex-col overflow-hidden relative">
            {/* Header matched to height h-10 (40px) */}
            <div className="flex items-center h-10 px-4 border-b border-border bg-muted/10 shrink-0">
              <span className="text-xs font-bold text-foreground">XML Payload Format (Schema Variables)</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                width="100%"
                language="xml"
                theme={monacoTheme}
                value={xmlPayloadFormat}
                onChange={(val) => setXmlPayloadFormat(val || '')}
                beforeMount={handleEditorWillMount}
                options={{ minimap: { enabled: false }, fontSize: 12 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Syntax Cheat Sheet Drawer */}
      {showDocumentation && (
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-card border-l border-border z-[105] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">Template Syntax Guide</h4>
            </div>
            <button 
              onClick={() => setShowDocumentation(false)}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-muted-foreground">
            <p className="leading-relaxed">
              Templates use Handlebars-inspired tokens to bind dynamic variables parsed from XML payloads.
            </p>

            <div className="space-y-1.5">
              <div className="font-bold text-foreground text-xs uppercase">1. Variables Mapping</div>
              <p className="text-[11px]">Reference tags directly or traverse nested elements using dot (`.`) or slash (`/`) paths.</p>
              <pre className="p-3 bg-muted rounded font-mono text-[10px] text-foreground leading-relaxed overflow-x-auto">
                {"<!-- XML Source -->\n<customer>\n  <name>John Doe</name>\n</customer>\n\n<!-- Template Bindings -->\n{{customer.name}}\n{{customer/name}}"}
              </pre>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-foreground text-xs uppercase">2. Collection Loops</div>
              <p className="text-[11px]">Iterate over list arrays. Items inside the block are scoped locally.</p>
              <pre className="p-3 bg-muted rounded font-mono text-[10px] text-foreground leading-relaxed overflow-x-auto">
                {"<!-- XML Source -->\n<items>\n  <item>\n    <description>Service A</description>\n  </item>\n</items>\n\n<!-- Template Loop -->\n{{#each items}}\n  <tr><td>{{description}}</td></tr>\n{{/each}}"}
              </pre>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-foreground text-xs uppercase">3. Paginated Loops</div>
              <p className="text-[11px]">Split lists into custom chunks of size N. Automatically renders page containers.</p>
              <pre className="p-3 bg-muted rounded font-mono text-[10px] text-foreground leading-relaxed overflow-x-auto">
                {"<!-- Page Chunking Helper -->\n{{#eachPage items size=6}}\n  <div class=\"page\">\n    <h2>Page {{pageNumber}} of {{totalPages}}</h2>\n  </div>\n{{/eachPage}}"}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
