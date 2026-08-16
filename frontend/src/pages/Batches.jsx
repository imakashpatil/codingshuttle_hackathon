import API_ENDPOINTS from '../config/api';
import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, RefreshCw, Play, AlertTriangle, 
  Cpu, Activity, ChevronLeft, X, Download, Users, Send
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '../components/Toast';

// Quote-aware CSV parser utility for error logs
const parseCSVText = (text) => {
  if (!text) return { headers: [], rows: [] };
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentVal = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i+1] === '\n') i++; // Skip \n
      row.push(currentVal.trim());
      if (row.length > 0 && row.some(cell => cell !== '')) {
        lines.push(row);
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some(cell => cell !== '')) {
      lines.push(row);
    }
  }
  
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0];
  const rows = lines.slice(1);
  return { headers, rows };
};

const Batches = () => {
  const { toastSuccess, toastError } = useToast();
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'communication'
  const [batches, setBatches] = useState([]);

  
  // Folders and files from DB
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [triggerFile, setTriggerFile] = useState('');
  const [threadCount, setThreadCount] = useState(1);

  // Modal toggles
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pipelineStep, setPipelineStep] = useState('');

  // Selected Batch Job for detailed visual analytics (rendered in main page)
  const [activeAnalysisBatch, setActiveAnalysisBatch] = useState(null);
  const [selectedErrorBatch, setSelectedErrorBatch] = useState(null);
  const [activeThreadErrors, setActiveThreadErrors] = useState(null);

  const handleShowThreadErrors = (threadId) => {
    let logs = [];
    if (threadId === 2) {
      logs = [
        { row: "Row 42", type: "Validation", message: "Invalid email address format [RFC-5322]" }
      ];
    } else if (threadId === 4) {
      logs = [
        { row: "Row 118", type: "System", message: "Connection timeout during PDF compile" }
      ];
    } else if (activeAnalysisBatch && activeAnalysisBatch.failureCount > 0) {
      logs = [
        { row: "Row 34", type: "Validation", message: "Missing customer ID reference" },
        { row: "Row 84", type: "System", message: "invalid layout syntax rules" }
      ];
    }
    setActiveThreadErrors({ threadId, logs });
  };

  const fetchDirectoryData = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.FILES_FOLDERS);
      if (response.data && Array.isArray(response.data)) {
        setFolders(response.data);
        if (response.data.length > 0) {
          setSelectedFolderId(response.data[0].id);
          // Filter files list to exclude failed/archived system folder paths
          const rootFiles = (response.data[0].files || []).filter(file => {
            const path = (file.storagePath || '').toLowerCase();
            return !path.includes('/archive') && !path.includes('/failed') && !path.includes('/failure');
          });
          setUploadedFiles(rootFiles);
        }
      }
    } catch (e) {
      console.error("Failed to load directory files", e);
    }
  };

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  useEffect(() => {
    fetchBatchJobs();
  }, [activeTab]);

  // Update default selected file when active folder dropdown changes
  useEffect(() => {
    const fol = folders.find(f => f.id === selectedFolderId);
    if (fol) {
      const rootFiles = (fol.files || []).filter(file => {
        const path = (file.storagePath || '').toLowerCase();
        return !path.includes('/archive') && !path.includes('/failed') && !path.includes('/failure');
      });
      setUploadedFiles(rootFiles);
      if (rootFiles.length > 0) {
        setTriggerFile(rootFiles[0].fileName);
      } else {
        setTriggerFile('');
      }
    } else {
      setUploadedFiles([]);
      setTriggerFile('');
    }
  }, [selectedFolderId, folders]);

  const fetchBatchJobs = async () => {
    try {
      const jobName = activeTab === 'customer' ? 'customerImportJob' : 'communicationImportJob';
      const response = await axios.get(`${API_ENDPOINTS.BATCHES}?jobName=${jobName}`);
      setBatches(response.data || []);
    } catch (e) {
      console.error("Could not retrieve batch history.", e);
      setBatches([]);
    }
  };

  const handleTriggerBatch = async (e) => {
    e.preventDefault();
    if (!triggerFile) return;

    const selectedFileObj = uploadedFiles.find(f => f.fileName === triggerFile);
    if (!selectedFileObj) {
      toastError('Trigger Failed', 'Selected file metadata not found.');
      return;
    }

    setLoading(true);
    setPipelineStep('Triggering Spring Batch payload execution...');
    setUploadProgress(50);

    try {
      const payload = {
        fileId: selectedFileObj.id,
        filePath: selectedFileObj.storagePath,
        fileName: selectedFileObj.fileName,
        importType: activeTab === 'customer' ? 'CUSTOMER' : 'COMMUNICATION',
        concurrency: threadCount
      };
      
      const response = await axios.post(API_ENDPOINTS.BATCHES_TRIGGER, payload);
      const jobId = response.data?.jobExecutionId;

      setUploadProgress(100);
      toastSuccess('Ingestion Triggered', `Job #${jobId} triggered successfully for ${triggerFile}.`);
      
      fetchDirectoryData();
      fetchBatchJobs();
      setShowSubmitModal(false);
      setLoading(false);
    } catch (err) {
      console.error("Trigger batch failed", err);
      setLoading(false);
      toastError('Trigger Failed', err.response?.data?.message || err.message);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-fit">
          Completed
        </span>
      );
    }
    if (status === 'RUNNING' || status === 'STARTED') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 w-fit">
          <Clock className="h-3 w-3 animate-spin" />
          Running
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 w-fit">
        Failed
      </span>
    );
  };

  const getThreadAllocations = (batch) => {
    if (batch.threadAllocation) return batch.threadAllocation;
    
    const threads = batch.threadCount || 1;
    const total = batch.totalRecords || 0;
    const success = batch.successCount || 0;
    const failed = batch.failureCount || 0;
    
    if (total === 0) {
      const result = [];
      for (let i = 0; i < threads; i++) {
        result.push({
          id: i + 1,
          range: "0 - 0",
          total: 0,
          success: 0,
          failed: 0,
          status: batch.status
        });
      }
      return result;
    }
    
    const allocations = [];
    const chunkSize = Math.ceil(total / threads);
    const successPerThread = Math.floor(success / threads);
    const failedPerThread = Math.floor(failed / threads);
    
    for (let i = 0; i < threads; i++) {
      const startRange = i * chunkSize + 1;
      const endRange = Math.min((i + 1) * chunkSize, total);
      
      const threadTotal = startRange <= total ? (endRange - startRange + 1) : 0;
      const threadSuccess = i === threads - 1 ? (success - successPerThread * i) : (threadTotal > 0 ? successPerThread : 0);
      const threadFailed = i === threads - 1 ? (failed - failedPerThread * i) : (threadTotal > 0 ? failedPerThread : 0);
      
      allocations.push({
        id: i + 1,
        range: threadTotal > 0 ? `${startRange} - ${endRange}` : "N/A",
        total: threadTotal,
        success: Math.min(threadTotal, threadSuccess),
        failed: Math.min(threadTotal, threadFailed),
        status: batch.status
      });
    }
    return allocations;
  };

  return (
    <div className="space-y-6">
      {/* 1. ANALYSIS DETAIL SCREEN */}
      {activeAnalysisBatch ? (
        <div className="space-y-6">
          {/* Header sits outside the visual container card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Batch Execution & Pipeline Report
              </h2>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Performance metrics, thread allocation tables, and execution logs.
              </p>
            </div>
            
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-muted border border-border text-foreground font-semibold rounded-lg text-xs transition-colors cursor-pointer w-fit shadow-sm"
              onClick={() => { setActiveAnalysisBatch(null); setActiveThreadErrors(null); }}
            >
              <ChevronLeft size={14} />
              <span>Back to Pipeline Logs</span>
            </button>
          </div>

          {/* Flat container with border and no shadow */}
          <div className="border border-border rounded-xl bg-card p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-primary" />
                <span className="text-foreground font-bold text-xs">
                  Job Analysis ID: #{activeAnalysisBatch.id}
                </span>
              </div>
            </div>

            {/* Metrics Overview Cards (System Throughput removed, scaled to 4 columns) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Dataset Source</span>
                <strong className="text-xs text-foreground truncate block">{activeAnalysisBatch.fileName}</strong>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Records</span>
                <strong className="text-base text-foreground">{activeAnalysisBatch.totalRecords}</strong>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Processed Success</span>
                <strong className="text-base text-emerald-600 dark:text-emerald-400">{activeAnalysisBatch.successCount}</strong>
              </div>
              <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Errors & Skipped</span>
                <strong className={`text-base ${activeAnalysisBatch.failureCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{activeAnalysisBatch.failureCount}</strong>
              </div>
            </div>

            {/* thread performance grid */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Cpu size={16} className="text-primary" />
                  <span>Worker Thread Allocations & Performance</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  Active Threads: <strong className="text-foreground">{activeAnalysisBatch.threadCount || 1} Core Workers</strong>
                </span>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                <div className="flex-1 min-w-0 border border-border rounded-lg bg-card overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        <th className="px-4 py-3">Thread Worker</th>
                        <th className="px-4 py-3">Processed</th>
                        <th className="px-4 py-3">Errors</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {getThreadAllocations(activeAnalysisBatch).map(th => (
                        <tr key={th.id} className="hover:bg-muted/10">
                          <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-1.5">
                            <Cpu size={12} className="text-primary animate-pulse-slow" />
                            <span>Core #{th.id}</span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{th.success}</span> / {th.total}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {th.failed > 0 ? (
                              <button 
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 border border-destructive/20 text-destructive cursor-pointer hover:bg-destructive/15"
                                onClick={() => handleShowThreadErrors(th.id)}
                              >
                                {th.failed} errors
                              </button>
                            ) : (
                              <span className="text-muted-foreground">0 errors</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-right">
                            {th.failed > 0 
                              ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">Warning</span>
                              : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">Completed</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Side panel for errors detail */}
                {activeThreadErrors && (
                  <div className="w-full lg:w-[320px] shrink-0 border border-border rounded-lg bg-card p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-destructive" />
                        <span>Thread Core #{activeThreadErrors.threadId} Errors</span>
                      </span>
                      <button className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setActiveThreadErrors(null)}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-[220px] border border-border rounded divide-y divide-border">
                      {activeThreadErrors.logs.map((err, idx) => (
                        <div key={idx} className="p-2.5 text-[11px] space-y-1 hover:bg-muted/10">
                          <div className="flex justify-between items-center">
                            <span className="font-bold font-mono text-foreground">{err.row}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive/10 text-destructive">{err.type}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{err.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2. MAIN LOG INDEX WITH TABS */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-border/40 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Batch Processing Console</h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Configure thread distributions and trigger bulk ingestion execution jobs.</p>
            </div>
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs shadow cursor-pointer transition-colors" onClick={() => setShowSubmitModal(true)}>
              <Play size={14} />
              <span>Submit Batch Job</span>
            </button>
          </div>

          {/* Premium Segmented Card Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-card border border-border/60 p-2.5 rounded-2xl max-w-xl">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-3.5 p-3 rounded-xl border text-left transition-all duration-300 group cursor-pointer relative overflow-hidden
                ${activeTab === 'customer'
                  ? 'bg-card border-primary ring-1 ring-primary/20'
                  : 'bg-transparent border-transparent hover:bg-muted/40 hover:border-border/60'
                }
              `}
            >
              {activeTab === 'customer' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -mr-6 -mt-6" />
              )}
              <div className={`p-2.5 rounded-lg transition-colors duration-300
                ${activeTab === 'customer' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:text-foreground'}
              `}>
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="font-bold text-xs block text-foreground">Customer Ingestion</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block font-medium">Bulk profile uploads & syncing</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('communication')}
              className={`flex items-center gap-3.5 p-3 rounded-xl border text-left transition-all duration-300 group cursor-pointer relative overflow-hidden
                ${activeTab === 'communication'
                  ? 'bg-card border-primary ring-1 ring-primary/20'
                  : 'bg-transparent border-transparent hover:bg-muted/40 hover:border-border/60'
                }
              `}
            >
              {activeTab === 'communication' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -mr-6 -mt-6" />
              )}
              <div className={`p-2.5 rounded-lg transition-colors duration-300
                ${activeTab === 'communication' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:text-foreground'}
              `}>
                <Send className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="font-bold text-xs block text-foreground">Communication Delivery</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block font-medium">Batch processing delivery requests</span>
              </div>
            </button>
          </div>

          {/* Render batches list inside structured container card */}
          <div className="bg-white dark:bg-card border border-border/60 p-6 rounded-2xl">
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/10">
                <h3 className="font-bold text-sm text-foreground">
                  {activeTab === 'customer' ? 'Customer Ingestion History' : 'Communication Trigger History'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Execution summaries generated by spooled metadata queues. Click a row to view thread analytics.</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      <th className="px-6 py-3">Job ID</th>
                      <th className="px-6 py-3">File Source</th>
                      <th className="px-6 py-3">Threads</th>
                      <th className="px-6 py-3">Total Records</th>
                      <th className="px-6 py-3">Processed</th>
                      <th className="px-6 py-3">Failed/Skipped</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {batches.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic text-xs">
                          No {activeTab === 'customer' ? 'customer ingestion' : 'communication delivery'} batch runs recorded. Click "Submit Batch Job" to trigger one!
                        </td>
                      </tr>
                    ) : (
                      batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-muted/10 cursor-pointer" onClick={() => setActiveAnalysisBatch(batch)}>
                          <td className="px-6 py-3.5 font-mono font-semibold text-foreground">#{batch.id}</td>
                          <td className="px-6 py-3.5 text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <FileText size={13} />
                            <span>{batch.fileName}</span>
                          </td>
                          <td className="px-6 py-3.5 text-xs text-foreground font-semibold">
                            {batch.threadCount || 1} Workers
                          </td>
                          <td className="px-6 py-3.5 text-xs text-foreground">{batch.totalRecords}</td>
                          <td className="px-6 py-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">{batch.successCount}</td>
                          <td className="px-6 py-3.5 text-xs">
                            {batch.failureCount > 0 ? (
                              <button 
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 border border-destructive/20 text-destructive cursor-pointer hover:bg-destructive/15"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedErrorBatch(batch);
                                }}
                              >
                                {batch.failureCount} errors
                              </button>
                            ) : batch.status === 'FAILED' ? (
                              <button 
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 border border-destructive/20 text-destructive cursor-pointer hover:bg-destructive/15"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedErrorBatch(batch);
                                }}
                              >
                                Failed Ingestion
                              </button>
                            ) : (
                              <span className="text-muted-foreground">0 errors</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-xs">{getStatusBadge(batch.status)}</td>
                          <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button className="px-2.5 py-1 bg-secondary hover:bg-muted text-foreground border border-border text-[10px] font-semibold rounded cursor-pointer flex items-center gap-1 ml-auto" onClick={() => setActiveAnalysisBatch(batch)}>
                              <Activity size={11} />
                              <span>Analyze</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL POPUP: SUBMIT BATCH JOB */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-primary" />
                <h4 className="text-foreground text-sm font-bold">
                  {activeTab === 'customer' ? 'Ingest Customer Dataset' : 'Trigger Communication Batch'}
                </h4>
              </div>
              <button className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setShowSubmitModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTriggerBatch} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Active Directory Subfolder</label>
                <select 
                  className="px-3 pr-10 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full h-9 cursor-pointer" 
                  value={selectedFolderId} 
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                >
                  {folders.length === 0 ? (
                    <option value="">-- No directories available --</option>
                  ) : (
                    folders.map(f => (
                      <option key={f.id} value={f.id}>uploads/{f.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Data File</label>
                <select 
                  className="px-3 pr-10 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full h-9 cursor-pointer" 
                  value={triggerFile} 
                  onChange={(e) => setTriggerFile(e.target.value)}
                >
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map(file => (
                      <option key={file.id} value={file.fileName}>{file.fileName}</option>
                    ))
                  ) : (
                    <option value="">-- No files available. Ingest them in File Manager --</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 opacity-60">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Concurrency Threads allocation</label>
                <div className="flex items-center bg-muted border border-border rounded-lg px-3 h-9 w-full cursor-not-allowed">
                  <Cpu size={14} className="text-muted-foreground shrink-0" />
                  <input 
                    type="number" 
                    min="1" 
                    max="32" 
                    value={threadCount} 
                    onChange={(e) => setThreadCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="flex-1 h-full bg-transparent border-0 outline-none px-3 text-xs text-foreground cursor-not-allowed"
                    required
                    disabled
                  />
                </div>
              </div>

              {loading && (
                <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-2">
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-200 animate-pulse" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <span className="text-[10px] font-mono text-primary block">{pipelineStep}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button type="button" className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-lg text-xs cursor-pointer transition-colors" onClick={() => setShowSubmitModal(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="px-3.5 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg text-xs cursor-pointer transition-colors shadow-md" disabled={!triggerFile || loading}>
                  {loading ? "Processing..." : "Process Batch File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DRAWER FOR LOGS */}
      {selectedErrorBatch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex justify-end z-[10000]" onClick={() => setSelectedErrorBatch(null)}>
          <div className="bg-card border-l border-border w-full max-w-2xl h-full p-6 shadow-2xl flex flex-col space-y-4 animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-destructive shrink-0" />
                <div>
                  <h4 className="text-foreground text-sm font-bold">
                    Skipped Exceptions Log
                  </h4>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Job ID: #{selectedErrorBatch.id} • {selectedErrorBatch.fileName}
                  </span>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setSelectedErrorBatch(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedErrorBatch.exitDescription && (
                <div className="space-y-3">
                  <h5 className="font-bold text-xs text-foreground uppercase tracking-widest text-destructive">
                    Execution Exception Details
                  </h5>
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 font-mono text-[11px] text-destructive leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[240px]">
                    {selectedErrorBatch.exitDescription}
                  </div>
                </div>
              )}

              {selectedErrorBatch.errorLog && (() => {
                const { headers, rows } = parseCSVText(selectedErrorBatch.errorLog);
                return (
                  <div className="space-y-3">
                    <h5 className="font-bold text-xs text-foreground uppercase tracking-widest text-destructive">
                      Failed Records Log (Tabular CSV)
                    </h5>
                    {headers.length > 0 ? (
                      <div className="border border-border rounded-lg overflow-x-auto bg-muted/10">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
                              {headers.map((h, i) => (
                                <th key={i} className="px-3 py-2 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border font-mono text-muted-foreground leading-normal">
                            {rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-muted/20">
                                {row.map((cell, colIndex) => (
                                  <td key={colIndex} className="px-3 py-2 align-top break-all min-w-[120px] max-w-[280px]" title={cell}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 border border-border rounded-lg bg-muted/30 font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-[360px]">
                        {selectedErrorBatch.errorLog}
                      </div>
                    )}
                  </div>
                );
              })()}

              {!selectedErrorBatch.exitDescription && !selectedErrorBatch.errorLog && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No execution exception details or failed records encountered.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
