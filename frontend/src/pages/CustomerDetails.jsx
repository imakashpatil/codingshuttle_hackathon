import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, MessageSquare, Landmark, Send, Calendar, CheckCircle2, XCircle, FileText, Code, Eye, X, Download } from 'lucide-react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import API_ENDPOINTS from '../config/api';


const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState('RENDERED'); // 'RENDERED' | 'XML'
  const [activeChannelPreview, setActiveChannelPreview] = useState(null);
  const [monacoTheme, setMonacoTheme] = useState('vs-dark');

  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editPostal, setEditPostal] = useState('');

  useEffect(() => {
    setIsEditingContact(false);
  }, [activeChannelPreview]);

  const handleStartEditContact = () => {
    setEditEmail(activeChannelPreview.email || '');
    setEditMobile(activeChannelPreview.mobileNumber || '');
    setEditPostal(activeChannelPreview.postalAddress || '');
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    try {
      const payload = {};
      if (activeChannelPreview.channel === 'EMAIL') {
        payload.email = editEmail;
      } else if (activeChannelPreview.channel === 'SMS' || activeChannelPreview.channel === 'WHATSAPP') {
        payload.mobileNumber = editMobile;
      } else if (activeChannelPreview.channel === 'POSTAL') {
        payload.postalAddress = editPostal;
      }

      const res = await axios.put(API_ENDPOINTS.COMMUNICATION_UPDATE(activeChannelPreview.id), payload);
      
      const updatedComm = res.data;
      
      setActiveChannelPreview(prev => ({
        ...prev,
        email: updatedComm.email,
        mobileNumber: updatedComm.mobileNumber,
        postalAddress: updatedComm.postalAddress
      }));

      setLogs(prevLogs => prevLogs.map(log => {
        if (log.id === selectedLog.id) {
          return {
            ...log,
            channels: log.channels.map(ch => {
              if (ch.id === activeChannelPreview.id) {
                return {
                  ...ch,
                  email: updatedComm.email,
                  mobileNumber: updatedComm.mobileNumber,
                  postalAddress: updatedComm.postalAddress
                };
              }
              return ch;
            })
          };
        }
        return log;
      }));

      setIsEditingContact(false);
    } catch (err) {
      console.error("Failed to update communication contact details", err);
      alert("Failed to update destination details. Please try again.");
    }
  };

  useEffect(() => {
    const fetchAttempts = async () => {
      if (!activeChannelPreview || !activeChannelPreview.id) {
        setAttempts([]);
        return;
      }
      try {
        setAttemptsLoading(true);
        const res = await axios.get(API_ENDPOINTS.COMMUNICATION_ATTEMPTS(activeChannelPreview.id));
        setAttempts(res.data || []);
      } catch (err) {
        console.error("Failed to fetch delivery attempts", err);
        setAttempts([]);
      } finally {
        setAttemptsLoading(false);
      }
    };
    fetchAttempts();
  }, [activeChannelPreview]);


  // Dynamic theme listener for Monaco Editor
  useEffect(() => {
    const updateTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      setMonacoTheme(isLight ? 'vs' : 'vs-dark');
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CUSTOMERS_DETAIL(id));
        if (res.data) {
          setCustomer(res.data);
          
          try {
            const commRes = await axios.get(API_ENDPOINTS.CUSTOMERS_COMMUNICATIONS(id));
            if (commRes.data && Array.isArray(commRes.data)) {
              const processedLogs = commRes.data.map(comm => {
                const isNct = comm.communicationDefinitionCode === 'NCT';
                let channels = [];
                if (comm.dispatches && comm.dispatches.length > 0) {
                  channels = comm.dispatches.map(d => {
                    const isEmail = d.channel === 'EMAIL';
                    const isPostal = d.channel === 'POSTAL';
                    return {
                      id: d.id,
                      channel: d.channel,
                      status: d.status,
                      errorMessage: d.errorMessage,
                      pdfPath: d.pdfPath,
                      renderedBody: d.renderedBody,
                      email: d.email,
                      mobileNumber: d.mobileNumber,
                      postalAddress: d.postalAddress,
                      templateName: d.channel + " Delivery Document Template",
                      templateCode: d.templateCode,
                      messageText: isEmail || isPostal ? "" : (d.renderedBody || "Plaintext message dispatch generated successfully. Status: " + d.status),
                      htmlContent: isEmail || isPostal ? (d.renderedBody || `
                        <div style="font-family: sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 600px; margin: auto;">
                          <h1 style="color: #10b981; font-size: 20px; font-weight: bold; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">NotifyHub Dispatch Status: ${d.status}</h1>
                          <p style="font-size: 14px; margin-top: 16px;">Dear <strong>${res.data.name}</strong>,</p>
                          <p style="font-size: 14px; line-height: 1.6;">Your communication statement has been processed successfully. Below is the summary of your dispatch request:</p>
                          <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 16px;">
                            <table style="width: 100%; font-size: 13px;">
                              <tr><td style="color: #64748b; padding-bottom: 8px;">Customer Code:</td><td style="font-weight: bold; text-align: right;">${res.data.customerCode}</td></tr>
                              <tr><td style="color: #64748b; padding-bottom: 8px;">Delivery Mode:</td><td style="font-weight: bold; text-align: right; color: #10b981;">${d.channel}</td></tr>
                              <tr><td style="color: #64748b; padding-bottom: 8px;">Status:</td><td style="font-weight: bold; text-align: right; color: #3b82f6;">${d.status}</td></tr>
                            </table>
                          </div>
                          ${d.pdfPath ? `<p style="font-size: 13px; color: #065f46; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 8px; margin-top: 16px;">📎 PDF Attachment spooled at: <code>${d.pdfPath.split('/').pop()}</code></p>` : ''}
                        </div>
                      `) : "",
                      docs: d.pdfPath ? [d.pdfPath.split('/').pop()] : []
                    };
                  });
                } else {
                  channels = isNct ? [
                    { channel: "EMAIL", status: comm.status, templateName: "Welcome Email Layout", templateCode: "EMAIL_WELCOME" },
                    { channel: "SMS", status: comm.status, templateName: "Welcome SMS Plaintext", templateCode: "SMS_WELCOME" }
                  ] : [
                    { 
                      channel: "EMAIL", 
                      status: comm.status === 'PENDING' ? 'PENDING' : 'DELIVERED', 
                      templateName: "Statement Notification Layout", 
                      templateCode: "EMAIL_BILL"
                    },
                    { 
                      channel: "WHATSAPP", 
                      status: comm.status === 'PENDING' ? 'PENDING' : 'DELIVERED', 
                      templateName: "Statement WhatsApp Layout", 
                      templateCode: "WA_BILL"
                    }
                  ];
                }

                return {
                  id: comm.id,
                  triggerCode: comm.communicationDefinitionCode,
                  triggerName: comm.definitionName || (isNct ? "Welcome Notification Ingestion Trigger" : "Statement Billing Dispatch Alert"),
                  status: comm.status,
                  timestamp: comm.createdAt || new Date().toISOString(),
                  channels: channels,
                  xmlPayload: comm.xmlData
                };
              });
              setLogs(processedLogs);
            } else {
              setLogs([]);
            }
          } catch (commErr) {
            console.error("Failed to load customer communications", commErr);
            setLogs([]);
          }
        }
      } catch (err) {
        console.error("Failed to get customer profile from DB.", err);
        setCustomer(null);
        setLogs([]);
      }
    };
    fetchCustomer();
  }, [id]);

  if (!customer) {
    return (
      <div className="p-8 text-center text-muted-foreground select-none">
        Loading customer profile...
      </div>
    );
  }

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    if (log.status === 'PENDING') {
      setActiveTab('XML');
    } else {
      setActiveTab('RENDERED');
    }
    if (log.channels && log.channels.length > 0) {
      setActiveChannelPreview(log.channels[0]);
    }
  };

  const getChannelIcon = (channel) => {
    if (channel === 'WHATSAPP') return <MessageSquare className="h-4 w-4 text-emerald-500 shrink-0" />;
    if (channel === 'EMAIL') return <Mail className="h-4 w-4 text-blue-500 shrink-0" />;
    if (channel === 'POSTAL') return <Landmark className="h-4 w-4 text-amber-500 shrink-0" />;
    if (channel === 'SMS') return <Send className="h-4 w-4 text-purple-500 shrink-0" />;
    return null;
  };

  const formatTimestamp = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    const isPending = status === 'PENDING' || status === 'PROCESSING' || status === 'WAITING_FOR_PDF';
    const isFailed = status === 'FAILED' || status === 'ERROR' || status === 'DEAD_LETTER';
    
    if (isPending) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 w-fit uppercase animate-pulse">
          Pending
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 w-fit uppercase">
          Failed
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-fit uppercase">
        Completed
      </span>
    );
  };


  const getFullAddress = () => {
    const parts = [
      customer.addressLine1,
      customer.addressLine2,
      customer.addressLine3,
      customer.city,
      customer.postalCode
    ].filter(Boolean);
    return parts.join(', ');
  };

  const preferredChannels = customer.preferredChannels || [];
  const activeStatus = customer.active === undefined ? true : customer.active;

  return (
    <div className="space-y-6">
      {/* Header Back Bar */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/customers')}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Customer Profile</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Auditing profile metadata and communication dispatch histories.</p>
          </div>
        </div>
      </div>

      {/* Profile Header Dashboard Card */}
      <div className="bg-white dark:bg-card border border-border/60 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-primary/10 rounded-xl text-primary flex items-center justify-center shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate pr-2">{customer.name}</h2>
              <code className="text-[10px] font-mono text-muted-foreground block mt-0.5">{customer.customerCode}</code>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider
            ${activeStatus 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }
          `}>
            {activeStatus ? 'Active' : 'Suspended'}
          </span>
        </div>

        {/* Profile Details Flex Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 pt-6 border-t border-border/40 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Email Contact</span>
            <span className="text-foreground font-semibold break-all">{customer.email}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Phone Number</span>
            <span className="text-foreground font-semibold">{customer.mobileNumber}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Language Preference</span>
            <span className="text-foreground font-semibold uppercase">{customer.preferredLanguage || 'ENGLISH'}</span>
          </div>

          <div className="space-y-1 md:col-span-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Postal Address</span>
            <span className="text-foreground font-medium leading-relaxed block truncate" title={getFullAddress()}>{getFullAddress() || 'No address registered'}</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Preferred Channels</span>
            <div className="flex items-center gap-1.5">
              {['WHATSAPP', 'EMAIL', 'SMS', 'POSTAL'].map((ch) => {
                const isOptedIn = preferredChannels.includes(ch);
                return (
                  <span
                    key={ch}
                    title={`${ch}: ${isOptedIn ? 'Opted In' : 'Opted Out'}`}
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full border transition-all
                      ${isOptedIn 
                        ? 'bg-primary/10 border-primary/20 text-primary opacity-100' 
                        : 'bg-muted/40 border-border/40 text-muted-foreground/40 opacity-30 grayscale'
                      }
                    `}
                  >
                    {getChannelIcon(ch)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMMUNICATION HISTORY LOGS */}
      <div className="bg-white dark:bg-card border border-border/60 p-6 rounded-2xl">
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/10">
            <h3 className="font-bold text-sm text-foreground">Sent Communication History Logs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Auditing dispatch queue statuses and output layouts generated for this profile.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground">
                  <th className="px-6 py-3">Trigger Definition</th>
                  <th className="px-6 py-3">Dispatch Date</th>
                  <th className="px-6 py-3">Channels Mapped</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground italic">
                      No communication dispatch logs recorded for this customer profile.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isPending = log.status === 'PENDING';
                    return (
                      <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-foreground">{log.triggerName}</div>
                          <code className="text-[9px] font-mono text-muted-foreground mt-0.5 block">{log.triggerCode}</code>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {log.channels.map((ch, idx) => (
                              <span 
                                key={idx} 
                                title={`${ch.channel} Mapped: ${ch.templateName}`}
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full border border-border bg-background
                                  ${isPending ? 'opacity-50' : 'opacity-100'}
                                `}
                              >
                                {getChannelIcon(ch.channel)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenDetail(log)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border hover:bg-muted text-foreground font-semibold rounded text-[10px] cursor-pointer shadow-sm"
                          >
                            <Eye className="h-3 w-3" />
                            <span>{isPending ? 'Review XML' : 'View Output'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide Modal Displaying Rendered Outputs and XML */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-[9999] transition-all">
          <div className="w-full max-w-4xl bg-card border-l border-border h-full flex flex-col shadow-2xl relative select-none">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between h-14 px-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground uppercase">{selectedLog.triggerName}</span>
                  <span className="text-[9px] font-mono text-muted-foreground mt-0.5">{formatTimestamp(selectedLog.timestamp)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Tab Controls */}
            <div className="flex h-10 px-5 border-b border-border bg-muted/5 gap-4">
              {selectedLog.status !== 'PENDING' && (
                <button
                  onClick={() => setActiveTab('RENDERED')}
                  className={`text-xs font-bold px-1 transition-all relative cursor-pointer
                    ${activeTab === 'RENDERED' 
                      ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  Rendered Output
                </button>
              )}
              <button
                onClick={() => setActiveTab('XML')}
                className={`text-xs font-bold px-1 transition-all relative cursor-pointer
                  ${activeTab === 'XML' || selectedLog.status === 'PENDING'
                    ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                XML Payload
              </button>
            </div>

            {/* Workspace details body */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'XML' ? (
                <div className="h-full relative overflow-hidden">
                  <Editor
                    height="100%"
                    width="100%"
                    language="xml"
                    theme={monacoTheme}
                    value={selectedLog.xmlPayload}
                    options={{ minimap: { enabled: false }, fontSize: 12, readOnly: true }}
                  />
                </div>
              ) : (
                <div className="h-full flex overflow-hidden divide-x divide-border">
                  {/* Left Side Channel Selection tab list */}
                  <div className="w-56 bg-muted/5 flex flex-col p-4 gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Select Channel Preview:</span>
                    {selectedLog.channels.map((ch, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveChannelPreview(ch)}
                        className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200
                          ${activeChannelPreview?.channel === ch.channel 
                            ? 'bg-primary/5 border-primary/40 text-primary shadow-sm' 
                            : 'bg-background hover:bg-muted border-border/80 text-foreground/80'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {getChannelIcon(ch.channel)}
                          <span className="uppercase font-semibold">{ch.channel}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground/60">{ch.status}</span>
                      </button>
                    ))}
                  </div>

                  {/* Right Side Rendered content Preview */}
                  <div className="flex-1 overflow-y-auto bg-muted/20 p-6 flex flex-col items-center">
                    {activeChannelPreview ? (
                      <div className="w-full max-w-lg space-y-4">
                        <div className="flex justify-between items-center bg-card border border-border p-3 rounded-lg text-xs">
                          <div>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Template Mapped</span>
                            <span className="font-bold text-foreground text-xs mt-0.5 block">{activeChannelPreview.templateName}</span>
                            <code className="text-[9px] font-mono text-muted-foreground block mt-0.5">{activeChannelPreview.templateCode}</code>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase
                            ${activeChannelPreview.status === 'DELIVERED' || activeChannelPreview.status === 'OPENED' || activeChannelPreview.status === 'SHIPPED' || activeChannelPreview.status === 'SENT'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                              : activeChannelPreview.status === 'FAILED' || activeChannelPreview.status === 'DEAD_LETTER'
                                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                            }
                          `}>
                            {activeChannelPreview.status}
                          </span>
                        </div>

                        {/* Target Contact Details & In-Place Editing */}
                        <div className="bg-card border border-border p-4 rounded-xl space-y-3 text-xs shadow-sm">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Target Delivery Destination</span>
                          
                          {isEditingContact ? (
                            <div className="space-y-3">
                              {activeChannelPreview.channel === 'EMAIL' && (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-muted-foreground">Email Address</label>
                                  <input 
                                    type="text" 
                                    value={editEmail} 
                                    onChange={(e) => setEditEmail(e.target.value)} 
                                    className="w-full p-2 border border-input rounded bg-background text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              )}
                              {(activeChannelPreview.channel === 'SMS' || activeChannelPreview.channel === 'WHATSAPP') && (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-muted-foreground">Mobile Phone Number</label>
                                  <input 
                                    type="text" 
                                    value={editMobile} 
                                    onChange={(e) => setEditMobile(e.target.value)} 
                                    className="w-full p-2 border border-input rounded bg-background text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              )}
                              {activeChannelPreview.channel === 'POSTAL' && (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-muted-foreground">Postal Address</label>
                                  <textarea 
                                    value={editPostal} 
                                    onChange={(e) => setEditPostal(e.target.value)} 
                                    rows={2}
                                    className="w-full p-2 border border-input rounded bg-background text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button 
                                  onClick={handleSaveContact} 
                                  className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded text-[11px] cursor-pointer hover:bg-primary/95 transition-colors"
                                >
                                  Save Changes
                                </button>
                                <button 
                                  onClick={() => setIsEditingContact(false)} 
                                  className="px-3 py-1.5 bg-secondary text-foreground font-bold rounded text-[11px] cursor-pointer hover:bg-secondary/80 border border-border transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center gap-4">
                              <div className="font-mono bg-muted/40 p-2 rounded border border-border/60 flex-1 break-all text-xs text-foreground select-text font-semibold">
                                {activeChannelPreview.channel === 'EMAIL' ? activeChannelPreview.email :
                                 activeChannelPreview.channel === 'SMS' || activeChannelPreview.channel === 'WHATSAPP' ? activeChannelPreview.mobileNumber :
                                 activeChannelPreview.channel === 'POSTAL' ? activeChannelPreview.postalAddress : ''}
                              </div>
                              {activeChannelPreview.id && (
                                <button 
                                  onClick={handleStartEditContact} 
                                  className="px-2.5 py-1.5 bg-secondary text-foreground font-bold rounded hover:bg-secondary/80 border border-border text-[10px] shrink-0 cursor-pointer transition-colors"
                                >
                                  Edit Contact
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Error Message Box if Failed */}
                        {(activeChannelPreview.status === 'FAILED' || activeChannelPreview.status === 'DEAD_LETTER') && (
                          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-2">
                            <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest block">Failure Error Log Message</span>
                            <p className="text-[11px] font-mono leading-relaxed text-red-600 dark:text-red-400 select-text">
                              {activeChannelPreview.errorMessage || 'Outbound dispatch attempt failed due to delivery strategy timeout.'}
                            </p>
                          </div>
                        )}

                        {/* Preview Screen */}
                        {activeChannelPreview.channel === 'EMAIL' || activeChannelPreview.channel === 'POSTAL' ? (
                          <div className="space-y-4 w-full">
                            <div className="border border-border/80 bg-background shadow-md rounded-xl overflow-hidden p-6 min-h-[500px]">
                              {/* A4 Size Paper Simulation */}
                              <div className="w-full h-full bg-background select-text">
                                {activeChannelPreview.htmlContent ? (
                                  <div dangerouslySetInnerHTML={{ __html: activeChannelPreview.htmlContent }} />
                                ) : (
                                  <div className="p-8 text-center text-muted-foreground italic">
                                    No visual HTML layout for Postal template. Print layout dispatch generated successfully.
                                  </div>
                                )}
                              </div>
                            </div>

                            {activeChannelPreview.pdfPath && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    const url = `${API_ENDPOINTS.API_BASE_URL}/communications/${activeChannelPreview.id}/pdf`;
                                    window.open(url, '_blank');
                                  }}
                                  className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/25 border border-primary/20 text-primary font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Download PDF Statement</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          // WhatsApp / SMS plaintext terminals
                          <div className="border border-border bg-background p-4 rounded-xl space-y-4">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Rendered Text Message:</span>
                            <div className="p-4 bg-muted/40 border border-border/80 rounded-lg text-xs leading-relaxed font-mono whitespace-pre-wrap select-text text-foreground">
                              {activeChannelPreview.messageText}
                            </div>
                            
                            {activeChannelPreview.docs && activeChannelPreview.docs.length > 0 && (
                              <div className="pt-2 border-t border-border/40 space-y-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Attached Document Layouts:</span>
                                <div className="space-y-1.5">
                                  {activeChannelPreview.docs.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 bg-muted/30 border border-border/60 rounded-lg text-xs font-semibold text-foreground h-10">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>{doc}</span>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const url = `${API_ENDPOINTS.API_BASE_URL}/communications/${activeChannelPreview.id}/pdf`;
                                          window.open(url, '_blank');
                                        }}
                                        className="p-1 hover:bg-muted rounded text-primary hover:text-primary/80 transition-colors cursor-pointer"
                                        title="Download PDF"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Delivery Attempts List */}
                        {attemptsLoading ? (
                          <div className="h-10 bg-muted/10 animate-pulse rounded-lg"></div>
                        ) : attempts && attempts.length > 0 ? (
                          <div className="pt-4 border-t border-border/40 space-y-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Delivery Attempts Log ({attempts.length})</span>
                            <div className="space-y-2">
                              {attempts.map((attempt, idx) => (
                                <div key={attempt.id || idx} className="p-3 bg-muted/40 border border-border/80 rounded-xl text-xs space-y-1">
                                  <div className="flex justify-between items-center font-semibold">
                                    <span className="text-foreground">Attempt #{attempt.attemptNumber}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase
                                      ${attempt.status === 'DELIVERED' 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                        : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                                      }
                                    `}>
                                      {attempt.status}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    Timestamp: {formatTimestamp(attempt.createdAt)}
                                  </div>
                                  {attempt.errorMessage && (
                                    <div className="text-[10px] font-mono text-red-500 bg-red-500/5 p-2 border border-red-500/10 rounded mt-1.5 leading-relaxed select-text">
                                      {attempt.errorMessage}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground italic">
                        Select a channel to review rendered outputs.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
