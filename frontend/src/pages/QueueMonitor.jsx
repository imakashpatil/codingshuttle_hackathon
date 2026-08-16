import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import { 
  RefreshCw, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Server, 
  Activity, 
  FileText,
  Mail, 
  MessageSquare, 
  PhoneCall, 
  Package,
  Search,
  Check,
  X,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const QueueMonitor = () => {
  const [dlqEvents, setDlqEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  // Tab counts
  const [counts, setCounts] = useState({ ALL: 0, EMAIL: 0, WHATSAPP: 0, SMS: 0, POSTAL: 0 });

  // Slide-over sheet states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetAttempts, setSheetAttempts] = useState([]);
  const [sheetAttemptsLoading, setSheetAttemptsLoading] = useState(false);

  // Contact editing states
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editPostal, setEditPostal] = useState('');

  // Track action loadings per communication ID
  const [actionLoading, setActionLoading] = useState({});
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchDlqCounts = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.DLQ_COUNTS);
      if (response.data) {
        setCounts(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch DLQ counts', err);
    }
  };

  const fetchDlqData = async (page = 0, channel = selectedChannel) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_ENDPOINTS.DLQ}?page=${page}&size=${pageSize}&channel=${channel}`);
      setDlqEvents(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
      setCurrentPage(response.data.number || 0);
    } catch (err) {
      logError(err);
      setError('Failed to fetch DLQ events. Please make sure the service is running.');
    } finally {
      setLoading(false);
    }
  };

  const logError = (err) => {
    console.error('API Error:', err);
  };

  useEffect(() => {
    fetchDlqData(0, selectedChannel);
    fetchDlqCounts();
  }, [selectedChannel]);

  // Fetch attempts for selected event in sheet
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!selectedEvent || !selectedEvent.id) {
        setSheetAttempts([]);
        return;
      }
      try {
        setSheetAttemptsLoading(true);
        const response = await axios.get(API_ENDPOINTS.COMMUNICATION_ATTEMPTS(selectedEvent.id));
        setSheetAttempts(response.data || []);
      } catch (err) {
        console.error("Failed to fetch attempts log", err);
      } finally {
        setSheetAttemptsLoading(false);
      }
    };

    fetchAttempts();
    setIsEditingContact(false);
  }, [selectedEvent]);

  const handleRetry = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await axios.post(API_ENDPOINTS.DLQ_RETRY(id));
      addToast('Message successfully republished to Kafka queue!', 'success');
      fetchDlqData(currentPage, selectedChannel);
      fetchDlqCounts();
    } catch (err) {
      logError(err);
      addToast('Failed to trigger manual retry. See console for details.', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleIgnore = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await axios.post(API_ENDPOINTS.DLQ_IGNORE(id));
      addToast('Message marked as ignored and removed from DLQ.', 'success');
      fetchDlqData(currentPage, selectedChannel);
      fetchDlqCounts();
    } catch (err) {
      logError(err);
      addToast('Failed to mark message as ignored.', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDownloadPdf = (id) => {
    const url = API_ENDPOINTS.DLQ_PDF(id);
    window.open(url, '_blank');
  };

  const handleStartEditContact = () => {
    setEditEmail(selectedEvent.email || '');
    setEditMobile(selectedEvent.mobileNumber || '');
    setEditPostal(selectedEvent.postalAddress || '');
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    try {
      const payload = {};
      if (selectedEvent.channel === 'EMAIL') {
        payload.email = editEmail;
      } else if (selectedEvent.channel === 'SMS' || selectedEvent.channel === 'WHATSAPP') {
        payload.mobileNumber = editMobile;
      } else if (selectedEvent.channel === 'POSTAL') {
        payload.postalAddress = editPostal;
      }

      const res = await axios.put(API_ENDPOINTS.COMMUNICATION_UPDATE(selectedEvent.id), payload);
      const updated = res.data;
      
      setSelectedEvent(prev => ({
        ...prev,
        email: updated.email,
        mobileNumber: updated.mobileNumber,
        postalAddress: updated.postalAddress
      }));

      setDlqEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, ...payload } : e));
      setIsEditingContact(false);
      addToast('Destination details updated successfully!', 'success');
    } catch (err) {
      console.error("Failed to update details", err);
      addToast('Failed to update details.', 'error');
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel?.toUpperCase()) {
      case 'EMAIL':
        return <Mail className="h-4 w-4 text-rose-500" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case 'SMS':
        return <PhoneCall className="h-4 w-4 text-sky-500" />;
      case 'POSTAL':
        return <Package className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-indigo-500" />;
    }
  };

  const filteredEvents = dlqEvents.filter(event => {
    const matchesSearch = 
      (event.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.templateCode?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.id?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const tabStyles = {
    ALL: {
      activeBorder: 'border-indigo-500 ring-1 ring-indigo-500/20',
      activeBg: 'bg-indigo-500/[0.08]',
      activeIcon: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      inactiveBorder: 'border-border/60 hover:border-indigo-300',
      inactiveBg: 'bg-indigo-500/[0.02]',
      inactiveIcon: 'bg-indigo-500/[0.06] text-indigo-500/70',
      glow: 'bg-indigo-500/5'
    },
    EMAIL: {
      activeBorder: 'border-rose-500 ring-1 ring-rose-500/20',
      activeBg: 'bg-rose-500/[0.08]',
      activeIcon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
      inactiveBorder: 'border-border/60 hover:border-rose-300',
      inactiveBg: 'bg-rose-500/[0.02]',
      inactiveIcon: 'bg-rose-500/[0.06] text-rose-500/70',
      glow: 'bg-rose-500/5'
    },
    WHATSAPP: {
      activeBorder: 'border-emerald-500 ring-1 ring-emerald-500/20',
      activeBg: 'bg-emerald-500/[0.08]',
      activeIcon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      inactiveBorder: 'border-border/60 hover:border-emerald-300',
      inactiveBg: 'bg-emerald-500/[0.02]',
      inactiveIcon: 'bg-emerald-500/[0.06] text-emerald-500/70',
      glow: 'bg-emerald-500/5'
    },
    SMS: {
      activeBorder: 'border-sky-500 ring-1 ring-sky-500/20',
      activeBg: 'bg-sky-500/[0.08]',
      activeIcon: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
      inactiveBorder: 'border-border/60 hover:border-sky-300',
      inactiveBg: 'bg-sky-500/[0.02]',
      inactiveIcon: 'bg-sky-500/[0.06] text-sky-500/70',
      glow: 'bg-sky-500/5'
    },
    POSTAL: {
      activeBorder: 'border-amber-500 ring-1 ring-amber-500/20',
      activeBg: 'bg-amber-500/[0.08]',
      activeIcon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      inactiveBorder: 'border-border/60 hover:border-amber-300',
      inactiveBg: 'bg-amber-500/[0.02]',
      inactiveIcon: 'bg-amber-500/[0.06] text-amber-500/70',
      glow: 'bg-amber-500/5'
    }
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Failures', count: counts.ALL, icon: <AlertCircle className="h-4 w-4" /> },
    { id: 'EMAIL', label: 'Email Failures', count: counts.EMAIL, icon: <Mail className="h-4 w-4" /> },
    { id: 'WHATSAPP', label: 'WhatsApp Failures', count: counts.WHATSAPP, icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'SMS', label: 'SMS Failures', count: counts.SMS, icon: <PhoneCall className="h-4 w-4" /> },
    { id: 'POSTAL', label: 'Postal Failures', count: counts.POSTAL, icon: <Package className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 relative pb-10">
      {/* Toast Alert Widget */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto animate-in slide-in-from-top duration-300 ${
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Outbound Dispatch Failures &amp; Retries</h1>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-2" title="Kafka Connected"></span>
          </div>
          <p className="text-muted-foreground mt-1">Audit, retry, and manage failed messaging channel deliveries</p>
        </div>
        <button 
          onClick={() => {
            fetchDlqData(currentPage, selectedChannel);
            fetchDlqCounts();
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all duration-200 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Metrics Tabs Dashboard summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedChannel(tab.id)}
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-300 group cursor-pointer relative overflow-hidden
              ${selectedChannel === tab.id
                ? `${tabStyles[tab.id].activeBorder} ${tabStyles[tab.id].activeBg}`
                : `${tabStyles[tab.id].inactiveBorder} ${tabStyles[tab.id].inactiveBg}`
              }
            `}
          >
            {selectedChannel === tab.id && (
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-xl -mr-6 -mt-6 ${tabStyles[tab.id].glow}`} />
            )}
            <div className={`p-2.5 rounded-lg transition-colors duration-300 shrink-0
              ${selectedChannel === tab.id ? tabStyles[tab.id].activeIcon : tabStyles[tab.id].inactiveIcon}
            `}>
              {tab.icon}
            </div>
            <div>
              <span className="font-bold text-xs text-foreground block">{tab.label}</span>
              <span className="text-xl font-extrabold text-foreground mt-0.5 block">
                {tab.count}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Main Workspace container */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
        {/* Toolbar filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search page by name, code, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background/50 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="space-y-4 py-8">
            <div className="h-10 bg-muted/20 animate-pulse rounded-lg"></div>
            <div className="h-16 bg-muted/10 animate-pulse rounded-lg"></div>
            <div className="h-16 bg-muted/10 animate-pulse rounded-lg"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-red-500 flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl text-muted-foreground flex flex-col items-center gap-3">
            <Check className="h-10 w-10 text-emerald-500 p-2 bg-emerald-500/10 rounded-full border border-emerald-500/20" />
            <div>
              <p className="font-bold text-foreground">No Failed Deliveries</p>
              <p className="text-xs mt-1">All messaging queue channel deliveries for this filter are in sync and running cleanly.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Channel</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Template Code</th>
                    <th className="p-4">Retries</th>
                    <th className="p-4">Error Log Message</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredEvents.map(event => (
                    <tr key={event.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(event.channel)}
                          <span className="font-bold text-xs uppercase text-foreground">{event.channel}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-foreground">{event.customerName || 'Valued Client'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">
                            {event.channel === 'EMAIL' ? event.email : 
                             event.channel === 'SMS' || event.channel === 'WHATSAPP' ? event.mobileNumber : 
                             event.channel === 'POSTAL' ? (event.postalAddress ? event.postalAddress : 'No Address Stored') : ''}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs px-2 py-1 rounded-md bg-secondary text-foreground border border-border/30">
                          {event.templateCode}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-xs text-foreground bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                          {event.retryCount || 0} / 3
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <span className="line-clamp-2 leading-relaxed font-mono text-[11px] text-red-600 dark:text-red-400">
                          {event.errorMessage || 'Outbound dispatch attempt failed due to delivery strategy timeout.'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsSheetOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold border border-border/60 transition-all duration-200 cursor-pointer ml-auto"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs">
                <span className="text-muted-foreground font-medium">
                  Showing page <span className="font-bold text-foreground">{currentPage + 1}</span> of <span className="font-bold text-foreground">{totalPages}</span> ({totalElements} total failures)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchDlqData(currentPage - 1, selectedChannel)}
                    disabled={currentPage === 0 || loading}
                    className="p-2 rounded-lg bg-secondary border border-border disabled:opacity-50 text-foreground cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => fetchDlqData(currentPage + 1, selectedChannel)}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="p-2 rounded-lg bg-secondary border border-border disabled:opacity-50 text-foreground cursor-pointer transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Slide-Over Sheet */}
      {isSheetOpen && selectedEvent && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1 cursor-pointer" onClick={() => setIsSheetOpen(false)} />
          
          <div className="w-full max-w-lg bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Sheet Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {getChannelIcon(selectedEvent.channel)}
                  <span>{selectedEvent.channel} Dispatch Details</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {selectedEvent.id}</p>
              </div>
              <button 
                onClick={() => setIsSheetOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Sheet Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Status Badge card */}
              <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-xl border border-border/40">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Current Status</span>
                  <span className="text-xs font-semibold text-foreground mt-0.5 block">Retry Limit Reached</span>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-extrabold border bg-red-500/10 border-red-500/25 text-red-500 uppercase tracking-wide">
                  {selectedEvent.status}
                </span>
              </div>

              {/* Template Code card */}
              <div className="bg-card border border-border/60 p-4 rounded-xl space-y-1.5">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Template Mapped</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs">{selectedEvent.channel} Template Code</span>
                  <code className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-foreground border border-border/30">
                    {selectedEvent.templateCode}
                  </code>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="bg-card border border-border/60 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Customer Destination Details</span>
                  {selectedEvent.id && !isEditingContact && (
                    <button 
                      onClick={handleStartEditContact}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Edit Details
                    </button>
                  )}
                </div>

                {isEditingContact ? (
                  <div className="space-y-3">
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-foreground">{selectedEvent.customerName || 'Valued Client'}</p>
                    </div>
                    {selectedEvent.channel === 'EMAIL' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Email Address</label>
                        <input 
                          type="text" 
                          value={editEmail} 
                          onChange={(e) => setEditEmail(e.target.value)} 
                          className="w-full p-2 border border-input rounded bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                    {(selectedEvent.channel === 'SMS' || selectedEvent.channel === 'WHATSAPP') && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Mobile Phone Number</label>
                        <input 
                          type="text" 
                          value={editMobile} 
                          onChange={(e) => setEditMobile(e.target.value)} 
                          className="w-full p-2 border border-input rounded bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                    {selectedEvent.channel === 'POSTAL' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Postal Address</label>
                        <textarea 
                          value={editPostal} 
                          onChange={(e) => setEditPostal(e.target.value)} 
                          rows={2}
                          className="w-full p-2 border border-input rounded bg-background text-foreground text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSaveContact} 
                        className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded text-[10px] cursor-pointer"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setIsEditingContact(false)} 
                        className="px-3 py-1.5 bg-secondary text-foreground border border-border font-bold rounded text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 py-1 border-b border-border/40">
                      <span className="text-slate-500 dark:text-slate-400">Client Name:</span>
                      <span className="col-span-2 font-semibold text-foreground text-right">{selectedEvent.customerName || 'Valued Client'}</span>
                    </div>
                    {selectedEvent.channel === 'EMAIL' && (
                      <div className="grid grid-cols-3 py-1 border-b border-border/40">
                        <span className="text-slate-500 dark:text-slate-400">Email:</span>
                        <span className="col-span-2 font-mono text-foreground text-right break-all">{selectedEvent.email || 'No email configured'}</span>
                      </div>
                    )}
                    {(selectedEvent.channel === 'SMS' || selectedEvent.channel === 'WHATSAPP') && (
                      <div className="grid grid-cols-3 py-1 border-b border-border/40">
                        <span className="text-slate-500 dark:text-slate-400">Phone Number:</span>
                        <span className="col-span-2 font-mono text-foreground text-right">{selectedEvent.mobileNumber || 'No number configured'}</span>
                      </div>
                    )}
                    {selectedEvent.channel === 'POSTAL' && (
                      <div className="grid grid-cols-3 py-1 border-b border-border/40">
                        <span className="text-slate-500 dark:text-slate-400">Address:</span>
                        <span className="col-span-2 font-sans text-foreground text-right">{selectedEvent.postalAddress || 'No address configured'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rendered Body Preview */}
              <div className="bg-card border border-border/60 p-4 rounded-xl space-y-3">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Spooled Message Content</span>
                <div className="p-3 bg-secondary/20 rounded-lg border border-border/40 max-h-48 overflow-y-auto font-mono text-xs select-text whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {selectedEvent.renderedBody || 'Plaintext message body spooled successfully.'}
                </div>
              </div>

              {/* Error Message log details */}
              <div className="bg-red-500/[0.03] border border-red-500/20 p-4 rounded-xl space-y-2">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block">Complete Error Stack</span>
                <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/10 font-mono text-[11px] leading-relaxed text-red-600 dark:text-red-400 select-text whitespace-pre-wrap overflow-x-auto max-h-40">
                  {selectedEvent.errorMessage || 'Outbound dispatch attempt failed due to delivery strategy timeout.'}
                </div>
              </div>

              {/* Delivery Attempts List */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Delivery History Log ({sheetAttempts.length})</span>
                </div>
                
                {sheetAttemptsLoading ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-muted/20 animate-pulse rounded-lg"></div>
                    <div className="h-10 bg-muted/20 animate-pulse rounded-lg"></div>
                  </div>
                ) : sheetAttempts.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No attempt logs registered.</p>
                ) : (
                  <div className="space-y-2">
                    {sheetAttempts.map((attempt, idx) => (
                      <div key={idx} className="p-3 bg-secondary/35 border border-border/60 rounded-xl text-xs flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="font-bold text-foreground">Attempt #{attempt.attemptNumber}</span>
                          <p className="text-[10px] text-muted-foreground font-mono leading-tight">{attempt.errorMessage || 'No error logs recorded.'}</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0
                          ${attempt.status === 'SUCCESS' || attempt.status === 'DELIVERED' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }
                        `}>
                          {attempt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Sheet Footer Actions */}
            <div className="p-6 border-t border-border bg-secondary/15 flex items-center justify-between gap-3">
              {selectedEvent.pdfPath && (
                <button 
                  onClick={() => handleDownloadPdf(selectedEvent.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-border text-foreground hover:bg-secondary/80 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              )}
              
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={() => {
                    handleIgnore(selectedEvent.id);
                    setIsSheetOpen(false);
                  }}
                  disabled={actionLoading[selectedEvent.id]}
                  className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-bold text-xs cursor-pointer transition-colors"
                >
                  Ignore
                </button>
                <button 
                  onClick={() => {
                    handleRetry(selectedEvent.id);
                    setIsSheetOpen(false);
                  }}
                  disabled={actionLoading[selectedEvent.id]}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 text-xs cursor-pointer transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${actionLoading[selectedEvent.id] ? 'animate-spin' : ''}`} />
                  Retry Dispatch
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default QueueMonitor;
