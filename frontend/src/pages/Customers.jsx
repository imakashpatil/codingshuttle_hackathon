import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Mail, MessageSquare, Landmark, Send, ArrowRight, Eye, ChevronLeft, ChevronRight, UserPlus, Edit3, Trash2, X, Info } from 'lucide-react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import { useToast, useConfirm } from '../components/Toast';

const Customers = () => {
  const navigate = useNavigate();
  const { toastSuccess, toastError, toastWarning } = useToast();
  const { confirm } = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination database properties
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  // Form fields
  const [customerCode, setCustomerCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('ENGLISH');
  const [preferredChannels, setPreferredChannels] = useState(['EMAIL', 'SMS']);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressLine3, setAddressLine3] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.CUSTOMERS}?page=${currentPage - 1}`);
      if (res.data && res.data.content) {
        setCustomers(res.data.content);
        setTotalPages(res.data.totalPages || 1);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      console.error("Failed to fetch customers from REST API.", err);
      setCustomers([]);
      setTotalPages(1);
      setTotalElements(0);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  const getChannelIcon = (channel) => {
    if (channel === 'WHATSAPP') return <MessageSquare className="h-3.5 w-3.5" />;
    if (channel === 'EMAIL') return <Mail className="h-3.5 w-3.5" />;
    if (channel === 'POSTAL') return <Landmark className="h-3.5 w-3.5" />;
    if (channel === 'SMS') return <Send className="h-3.5 w-3.5" />;
    return null;
  };

  const getStatusBadge = (active) => {
    if (active) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Suspended
      </span>
    );
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setCustomerCode('');
    setName('');
    setEmail('');
    setMobileNumber('');
    setPreferredLanguage('ENGLISH');
    setPreferredChannels(['EMAIL', 'SMS']);
    setAddressLine1('');
    setAddressLine2('');
    setAddressLine3('');
    setCity('');
    setPostalCode('');
    setEditingCustomerId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalMode('CREATE');
    setShowModal(true);
  };

  const handleOpenEdit = (cust) => {
    setCustomerCode(cust.customerCode || '');
    setName(cust.name || '');
    setEmail(cust.email || '');
    setMobileNumber(cust.mobileNumber || '');
    setPreferredLanguage(cust.preferredLanguage || 'ENGLISH');
    setPreferredChannels(cust.preferredChannels || []);
    setAddressLine1(cust.addressLine1 || '');
    setAddressLine2(cust.addressLine2 || '');
    setAddressLine3(cust.addressLine3 || '');
    setCity(cust.city || '');
    setPostalCode(cust.postalCode || '');
    setEditingCustomerId(cust.id);
    setModalMode('EDIT');
    setShowModal(true);
  };

  const handleToggleChannel = (ch) => {
    if (preferredChannels.includes(ch)) {
      setPreferredChannels(preferredChannels.filter(c => c !== ch));
    } else {
      setPreferredChannels([...preferredChannels, ch]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      customerCode,
      name,
      email,
      mobileNumber,
      preferredLanguage,
      preferredChannels,
      addressLine1,
      addressLine2,
      addressLine3,
      city,
      postalCode
    };

    try {
      if (modalMode === 'CREATE') {
        await axios.post(API_ENDPOINTS.CUSTOMERS, payload);
        toastSuccess('Customer Created', `"${name}" was added successfully.`);
      } else {
        await axios.put(`${API_ENDPOINTS.CUSTOMERS}/${editingCustomerId}`, payload);
        toastSuccess('Customer Updated', `"${name}" profile was updated.`);
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      console.error('Failed to submit customer payload.', err);
      toastError('Transaction Failed', err.response?.data?.message || 'Error processing customer transaction request.');
    }
  };

  const handleSuspend = async (id, customerName) => {
    const ok = await confirm({
      title: 'Suspend Customer',
      message: `"${customerName}" will be soft-deleted. Their data is retained but all notifications will be stopped.`,
      variant: 'warning',
      confirmText: 'Suspend',
    });
    if (!ok) return;

    try {
      await axios.delete(`${API_ENDPOINTS.CUSTOMERS}/${id}`);
      toastSuccess('Customer Suspended', `"${customerName}" was suspended successfully.`);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to suspend customer.', err);
      toastError('Suspend Failed', 'Unable to suspend customer record.');
    }
  };

  // Client side search filter on the current page records
  const displayedCustomers = customers.filter(cust => 
    cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cust.customerCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Customers Subscription Directory</h1>
          <p className="text-muted-foreground mt-1">Audit customer accounts, notification delivery channels, and subscription routing logs.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:bg-primary/95 transition-all cursor-pointer shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search control */}
      <div className="flex items-center p-4 bg-card border border-border rounded-xl">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name, code, or billing email..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-9"
          />
        </div>
      </div>

      {/* Database Customers Grid */}
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/10 text-xs font-bold text-muted-foreground">
              <th className="p-4">Customer ID</th>
              <th className="p-4">Name & Address</th>
              <th className="p-4">Email & Phone</th>
              <th className="p-4 text-center">Subscriptions</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs text-foreground/90">
            {displayedCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-muted-foreground italic">
                  No customers found. Click "Add Customer" to register a subscriber.
                </td>
              </tr>
            ) : (
              displayedCustomers.map((cust) => {
                const fullAddress = `${cust.addressLine1 || ''}${cust.addressLine2 ? ', ' + cust.addressLine2 : ''}, ${cust.city || ''} ${cust.postalCode || ''}`;
                const preferredChannels = cust.preferredChannels || [];
                return (
                  <tr key={cust.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-mono font-semibold text-primary">{cust.customerCode}</td>
                    <td className="p-4 max-w-[240px]">
                      <div className="font-bold text-foreground">{cust.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5" title={fullAddress}>
                        {fullAddress || 'No Address Line'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">{cust.email}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{cust.mobileNumber}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {['WHATSAPP', 'EMAIL', 'SMS', 'POSTAL'].map((ch) => {
                          const enabled = preferredChannels.includes(ch);
                          return (
                            <div 
                              key={ch}
                              title={`${ch}: ${enabled ? 'Enabled' : 'Disabled'}`}
                              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all
                                ${enabled 
                                  ? 'bg-primary/5 border-primary/20 text-primary font-bold' 
                                  : 'bg-muted/10 border-border/40 text-muted-foreground/30'
                                }
                              `}
                            >
                              {getChannelIcon(ch)}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(cust.active)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/customers/${cust.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-background border border-border hover:bg-muted text-foreground font-semibold rounded text-[10px] transition-all cursor-pointer shadow-sm"
                          title="View notification records"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View History</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(cust)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-background border border-border hover:bg-muted text-foreground font-semibold rounded text-[10px] transition-all cursor-pointer shadow-sm"
                          title="Modify profile details"
                        >
                          <Edit3 className="h-3 w-3 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {cust.active && (
                          <button
                            onClick={() => handleSuspend(cust.id, cust.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-600 font-semibold rounded text-[10px] transition-all cursor-pointer shadow-sm"
                            title="Suspend customer profile"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                            <span>Suspend</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Table Footer with Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/10 border-t border-border mt-auto">
          <span className="text-[10px] font-semibold text-muted-foreground">
            Page {currentPage} of {totalPages} ({totalElements} Total Customers)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-border rounded bg-background hover:bg-muted text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border border-border rounded bg-background hover:bg-muted text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Customer Slide Over Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-[9999] transition-all">
          <div className="w-full max-w-lg bg-card border-l border-border h-full flex flex-col shadow-2xl relative p-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  {modalMode === 'CREATE' ? 'Add Subscriber Profile' : 'Edit Subscriber Profile'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Customer ID Code *</label>
                  <input 
                    type="text"
                    required
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    placeholder="e.g. cust_acme_corp"
                    className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Full Name *</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Billing Email *</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. billing@acmecorp.com"
                    className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Mobile Number *</label>
                  <input 
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. +1 (555) 901-2026"
                    className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Preferred Language *</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full uppercase"
                >
                  <option value="ENGLISH">ENGLISH</option>
                  <option value="HINDI">HINDI</option>
                  <option value="MARATHI">MARATHI</option>
                </select>
              </div>

              {/* Channel subscriptions checkbox array */}
              <div className="flex flex-col gap-2 p-3 bg-muted/20 border border-border/60 rounded-xl">
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Channel Preferences</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {['WHATSAPP', 'EMAIL', 'SMS', 'POSTAL'].map((ch) => {
                    const checked = preferredChannels.includes(ch);
                    return (
                      <div 
                        key={ch} 
                        onClick={() => handleToggleChannel(ch)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200
                          ${checked 
                            ? 'bg-primary/5 border-primary/30 text-primary' 
                            : 'bg-background hover:bg-muted border-border/80 text-foreground/80'
                          }
                        `}
                      >
                        <div className="p-1 bg-muted rounded-full">
                          {getChannelIcon(ch)}
                        </div>
                        <span className="uppercase">{ch}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Physical Address layout */}
              <div className="space-y-3 p-3 bg-muted/10 border border-border/60 rounded-xl">
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Physical Address (For Postal channels)</label>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Address Line 1</label>
                  <input 
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. Suite 400"
                    className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Address Line 2</label>
                    <input 
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="e.g. 100 Enterprise Way"
                      className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Address Line 3</label>
                    <input 
                      type="text"
                      value={addressLine3}
                      onChange={(e) => setAddressLine3(e.target.value)}
                      placeholder="Optional"
                      className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">City</label>
                    <input 
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Silicon Valley"
                      className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest">Postal Code</label>
                    <input 
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 94025"
                      className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-3 border-t border-border/60 shrink-0 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border hover:bg-muted text-foreground font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all cursor-pointer shadow-sm font-sans"
                >
                  {modalMode === 'CREATE' ? 'Register Customer' : 'Save Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
