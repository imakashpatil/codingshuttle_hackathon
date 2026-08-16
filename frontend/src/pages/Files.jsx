import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderPlus, FileText, UploadCloud, Play, Trash2, Archive, 
  CheckCircle2, AlertCircle, RefreshCw, X, ChevronLeft, Eye, Database, 
  Info, FolderArchive, Search, LayoutGrid, List, HardDrive, Clock, 
  AlertTriangle, ChevronRight, Download, Copy
} from 'lucide-react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import { useToast, useConfirm } from '../components/Toast';

const Files = () => {
  const { toastSuccess, toastError, toastWarning } = useToast();
  const { confirm } = useConfirm();
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null); // null means directories list
  const [viewingSubfolder, setViewingSubfolder] = useState(null); // null | 'archive' | 'failure'
  
  // Custom Filters & View Settings
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sidebarShortcut, setSidebarShortcut] = useState('all'); // 'all' | 'recent' | 'archived' | 'failed'

  // Folder Creator Dialog States
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Upload Side Drawer States
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [uploadMode, setUploadMode] = useState('STANDARD'); // 'STANDARD' | 'CHUNK'
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Chunk Upload Simulation States
  const [chunkLogs, setChunkLogs] = useState([]);
  const [chunkSessionId, setChunkSessionId] = useState('');
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);

  // Metadata Sheet inspector States
  const [selectedFileMetadata, setSelectedFileMetadata] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load directories from DB
  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.FILES_FOLDERS);
      if (res.data && Array.isArray(res.data)) {
        setFolders(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch folders from REST API.", err);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleSelectFolder = async (id) => {
    setSelectedFolderId(id);
    setViewingSubfolder(null);
    setUploadFile(null);
    setUploading(false);
    setUploadProgress(0);
    setChunkLogs([]);
    setChunkSessionId('');
    setTotalChunks(0);
    setUploadedChunks(0);

    if (id) {
      try {
        const res = await axios.get(`${API_ENDPOINTS.FILES_FOLDERS}/${id}`);
        if (res.data) {
          setFolders(prev => prev.map(fol => fol.id === id ? res.data : fol));
        }
      } catch (err) {
        console.error("Failed to fetch folder details from API.", err);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const nameSanitized = newFolderName.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Check duplication in state
    if (folders.some(f => f.name === nameSanitized)) {
      toastWarning('Duplicate Name', `A folder named "${nameSanitized}" already exists.`);
      return;
    }

    try {
      const res = await axios.post(API_ENDPOINTS.FILES_FOLDERS, { name: nameSanitized });
      if (res.data) {
        const newFol = { ...res.data, files: [] };
        setFolders(prev => [...prev, newFol]);
        setSelectedFolderId(newFol.id);
        setViewingSubfolder(null);
        setShowFolderModal(false);
        setNewFolderName('');
        toastSuccess('Folder Created', `Directory "${nameSanitized}" was created in core storage.`);
      }
    } catch (err) {
      console.error('Failed to create folder on DB.', err);
      const errMsg = err.response?.data?.message || err.message || 'Connection timed out.';
      toastError('Folder Creation Failed', `Unable to create "${nameSanitized}": ${errMsg}`);
    }
  };

  const handleDeleteFolder = async (e, id, folderName) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete Directory',
      message: `"${folderName}" and all its files will be permanently deleted from core storage. This cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete Directory',
    });
    if (!ok) return;

    try {
      await axios.delete(`${API_ENDPOINTS.FILES_FOLDERS}/${id}`);
      toastSuccess('Directory Deleted', `"${folderName}" and its files were removed from storage.`);
      // Reset selected view if we deleted the current folder
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
      }
      fetchFolders();
    } catch (err) {
      console.error('Failed to delete folder from database.', err);
      const errMsg = err.response?.data?.message || err.message || 'Service unreachable.';
      toastError('Delete Failed', `Unable to delete "${folderName}": ${errMsg}`);
    }
  };

  const handleCopyFileName = (e, name) => {
    e.stopPropagation();
    navigator.clipboard.writeText(name);
    toastSuccess('Copied filename', `"${name}" copied to clipboard.`);
  };

  const getActiveFolder = () => {
    return folders.find(f => f.id === selectedFolderId);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
    if (status === 'PROCESSED' || status === 'READY') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 w-fit uppercase">
          {status}
        </span>
      );
    }
    if (status === 'PROCESSING' || status === 'UPLOADING') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 w-fit uppercase">
          {status}
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 w-fit uppercase">
          {status}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-500/10 border border-slate-500/25 text-slate-600 dark:text-slate-400 w-fit uppercase">
        {status}
      </span>
    );
  };

  const handleArchiveFile = async (fileId) => {
    try {
      // Trigger local mock update since file state can be simulated
      setFolders(prev => prev.map(fol => {
        if (fol.id === selectedFolderId) {
          return {
            ...fol,
            files: (fol.files || []).map(f => {
              if (f.id === fileId) {
                return { ...f, status: 'ARCHIVED', storagePath: f.storagePath.replace('/uploads', '/archive') };
              }
              return f;
            })
          };
        }
        return fol;
      }));
      toastSuccess('File Archived', 'The ingested payload was moved to the /archive system context.');
    } catch (err) {
      toastError('Archive Failed', err.message);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const runStandardUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      const res = await axios.post(API_ENDPOINTS.FILES_UPLOAD(selectedFolderId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (res.data) {
        const newFile = res.data;
        setFolders(prev => prev.map(fol => {
          if (fol.id === selectedFolderId) {
            return { ...fol, files: [newFile, ...(fol.files || [])] };
          }
          return fol;
        }));
      }
      setUploading(false);
      setUploadFile(null);
      setUploadProgress(0);
      setShowUploadDrawer(false);
      toastSuccess('Upload Complete', `"${uploadFile.name}" was uploaded to storage.`);

    } catch (err) {
      console.error('Failed standard upload on REST API.', err);
      setUploading(false);
      setUploadProgress(0);
      const errMsg = err.response?.data?.message || err.message || 'Service unreachable.';
      toastError('Upload Failed', `Unable to upload file: ${errMsg}`);
    }
  };

  const runChunkUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setChunkLogs([]);
    
    const logEntry = (msg) => {
      setChunkLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    try {
      logEntry(`Initializing file upload session for: ${uploadFile.name}`);
      logEntry(`POST /upload/init (Metadata size: ${formatBytes(uploadFile.size)})`);

      const initRes = await axios.post(API_ENDPOINTS.FILES_UPLOAD_INIT, {
        folderId: selectedFolderId,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        totalChunks: 5
      });

      const uploadId = initRes.data.uploadId;
      setChunkSessionId(uploadId);
      setTotalChunks(5);
      logEntry(`Session initialized. Session ID: ${uploadId}`);

      const chunkSize = Math.ceil(uploadFile.size / 5);
      for (let c = 0; c < 5; c++) {
        logEntry(`Uploading chunk ${c + 1} of 5...`);
        const start = c * chunkSize;
        const end = Math.min(start + chunkSize, uploadFile.size);
        const fileChunk = uploadFile.slice(start, end);

        const chunkFormData = new FormData();
        chunkFormData.append('chunk', fileChunk, `${uploadFile.name}.part${c}`);

        await axios.post(`${API_ENDPOINTS.FILES_UPLOAD_CHUNK(uploadId)}?chunkNumber=${c}`, chunkFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setUploadedChunks(c + 1);
        logEntry(`Chunk ${c + 1} upload verified.`);
      }

      logEntry(`All 5 chunks uploaded. Finalizing session...`);
      logEntry(`POST /upload/${uploadId}/complete`);
      const completeRes = await axios.post(API_ENDPOINTS.FILES_UPLOAD_COMPLETE(uploadId));
      logEntry(`Upload complete. Storage: ${completeRes.data.storagePath}`);

      // Add to files list in state
      setFolders(prev => prev.map(fol => {
        if (fol.id === selectedFolderId) {
          return { ...fol, files: [completeRes.data, ...(fol.files || [])] };
        }
        return fol;
      }));

      setUploading(false);
      setUploadFile(null);
      setShowUploadDrawer(false);
      toastSuccess('Chunked Upload Complete', `"${uploadFile.name}" was assembled and stored successfully.`);

    } catch (err) {
      console.error('Failed chunked upload on REST API.', err);
      setUploading(false);
      const errMsg = err.response?.data?.message || err.message || 'Service unreachable.';
      toastError('Chunk Upload Failed', `Unable to stream and merge file parts: ${errMsg}`);
    }
  };

  const getFileSubfolder = (file) => {
    const path = (file.storagePath || '').toLowerCase();
    if (path.includes('/archive')) {
      return 'archive';
    }
    if (path.includes('/failed') || path.includes('/failure')) {
      return 'failure';
    }
    return 'root';
  };

  const getFileIconAndBadge = (fileName) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.xml')) {
      return {
        icon: <FileText className="h-8 w-8 text-sky-500" />,
        badge: 'XML',
        theme: 'bg-sky-500/5 hover:border-sky-500/40 border-sky-100 dark:border-sky-950/20',
        badgeTheme: 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400'
      };
    }
    if (lower.endsWith('.csv')) {
      return {
        icon: <FileText className="h-8 w-8 text-emerald-500" />,
        badge: 'CSV',
        theme: 'bg-emerald-500/5 hover:border-emerald-500/40 border-emerald-100 dark:border-emerald-950/20',
        badgeTheme: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
      };
    }
    return {
      icon: <FileText className="h-8 w-8 text-indigo-500" />,
      badge: 'FILE',
      theme: 'bg-indigo-500/5 hover:border-indigo-500/40 border-indigo-100 dark:border-indigo-950/20',
      badgeTheme: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
    };
  };

  const activeFolder = getActiveFolder();

  // Filter files based on context (Selected folder or Shortcuts)
  const getCompiledFiles = () => {
    if (selectedFolderId) {
      const files = activeFolder?.files || [];
      return files.filter(f => {
        const subfolder = getFileSubfolder(f);
        if (viewingSubfolder === 'archive') return subfolder === 'archive';
        if (viewingSubfolder === 'failure') return subfolder === 'failure';
        return subfolder === 'root';
      });
    }

    // Compile files from ALL folders
    let allFiles = [];
    folders.forEach(fol => {
      if (fol.files) {
        fol.files.forEach(file => {
          allFiles.push({ ...file, folderId: fol.id, folderName: fol.name });
        });
      }
    });

    if (sidebarShortcut === 'recent') {
      return allFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (sidebarShortcut === 'archived') {
      return allFiles.filter(f => f.status === 'ARCHIVED' || getFileSubfolder(f) === 'archive');
    }
    if (sidebarShortcut === 'failed') {
      return allFiles.filter(f => f.status === 'FAILED' || getFileSubfolder(f) === 'failure');
    }
    return [];
  };

  const filesList = getCompiledFiles();
  const filteredFiles = filesList.filter(f => 
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFolders = folders.filter(fol => 
    fol.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCapacityBytes = folders.reduce((acc, f) => 
    acc + (f.files ? f.files.reduce((sum, file) => sum + file.fileSize, 0) : 0), 0
  );

  const activeCount = activeFolder?.files 
    ? activeFolder.files.filter(f => f.status !== 'ARCHIVED').length 
    : 0;

  const archiveFilesCount = activeFolder?.files
    ? activeFolder.files.filter(f => getFileSubfolder(f) === 'archive').length
    : 0;

  const failureFilesCount = activeFolder?.files
    ? activeFolder.files.filter(f => getFileSubfolder(f) === 'failure').length
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex justify-between items-center border-b border-border/40 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">File Manager</h1>
          <p className="text-muted-foreground mt-1 text-xs font-medium">Configure ingested file storage, trigger payloads, and simulation pipelines.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFolders}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-border hover:bg-muted text-foreground font-semibold rounded-lg text-xs cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all cursor-pointer shadow-sm"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Create Folder</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left Explorer Sidebar */}
        <div className="flex-none lg:w-72 bg-white dark:bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center gap-2 px-1">
              <HardDrive className="h-4 w-4 text-primary shrink-0" />
              <span className="text-[10px] uppercase font-bold text-foreground tracking-wider">System Drive</span>
            </div>

            {/* Sidebar Shortcuts */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setSelectedFolderId(null);
                  setSidebarShortcut('all');
                  setViewingSubfolder(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all
                  ${!selectedFolderId && sidebarShortcut === 'all'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="h-4 w-4" />
                  <span>All Directories</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-muted font-bold text-muted-foreground">
                  {folders.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setSelectedFolderId(null);
                  setSidebarShortcut('recent');
                  setViewingSubfolder(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all
                  ${!selectedFolderId && sidebarShortcut === 'recent'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4" />
                  <span>Recent Ingestions</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedFolderId(null);
                  setSidebarShortcut('archived');
                  setViewingSubfolder(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all
                  ${!selectedFolderId && sidebarShortcut === 'archived'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <FolderArchive className="h-4 w-4" />
                  <span>Archives Drive</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedFolderId(null);
                  setSidebarShortcut('failed');
                  setViewingSubfolder(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all
                  ${!selectedFolderId && sidebarShortcut === 'failed'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed Payloads</span>
                </div>
              </button>
            </div>

            {/* Folders List inside Directory tree */}
            <div className="border-t border-border/50 pt-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block px-1">Ingestion folders</span>
              <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto pr-1">
                {folders.map(fol => (
                  <div
                    key={fol.id}
                    onClick={() => handleSelectFolder(fol.id)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all group/item
                      ${selectedFolderId === fol.id
                        ? 'bg-primary/15 text-primary font-bold'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`h-4 w-4 shrink-0 ${selectedFolderId === fol.id ? 'text-primary' : 'text-slate-400'}`} />
                      <span className="truncate">{fol.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-muted font-bold text-muted-foreground group-hover/item:hidden">
                        {(fol.files || []).filter(f => f.status !== 'ARCHIVED').length}
                      </span>
                      <button
                        onClick={(e) => handleDeleteFolder(e, fol.id, fol.name)}
                        className="hidden group-hover/item:block p-0.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded"
                        title="Delete folder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Directory stats */}
          <div className="border-t border-border/50 pt-4 space-y-3 shrink-0">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block px-1">Storage Allocation</span>
            <div className="p-3 bg-muted/20 border border-border/50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Total Ingested:</span>
                <span className="font-bold text-foreground">
                  {folders.reduce((acc, f) => acc + (f.files ? f.files.length : 0), 0)} Files
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Disk Consumed:</span>
                <span className="font-bold text-foreground">
                  {formatBytes(totalCapacityBytes)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
              </div>
              <span className="text-[9px] text-muted-foreground leading-none mt-1.5 block">Allocated capacity: 10 GB</span>
            </div>
          </div>
        </div>

        {/* Right Main Panel (Workspace) */}
        <div className="flex-1 bg-white dark:bg-card border border-border/60 rounded-2xl p-6 flex flex-col space-y-6">
          {/* Main Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4 shrink-0">
            <div>
              <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 select-none">
                <span>notifyhub</span>
                <ChevronRight className="h-3 w-3" />
                <span>uploads</span>
                {selectedFolderId && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-primary font-bold">{activeFolder?.name}</span>
                  </>
                )}
                {!selectedFolderId && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-primary font-bold">
                      {sidebarShortcut === 'all' ? 'directories' : `system / ${sidebarShortcut}`}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-lg font-bold text-foreground mt-1 capitalize">
                {selectedFolderId ? activeFolder?.name : (sidebarShortcut === 'all' ? 'Directories' : `${sidebarShortcut} Ingestions`)}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Dynamic search query input */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus-within:ring-1 focus-within:ring-primary w-full md:w-60">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input 
                  type="text"
                  placeholder="Search file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 outline-none w-full text-xs text-foreground"
                />
              </div>

              {/* View Switcher toggle */}
              <div className="flex bg-muted/40 p-0.5 rounded border border-border/60">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded cursor-pointer transition-all ${viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded cursor-pointer transition-all ${viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Upload file triggers */}
              {selectedFolderId && !viewingSubfolder && (
                <button
                  onClick={() => setShowUploadDrawer(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all cursor-pointer shadow-sm ml-auto md:ml-0"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload File</span>
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto min-h-[400px]">
            {/* VIEW 1: Directory Cards Grid (Default Screen) */}
            {!selectedFolderId && sidebarShortcut === 'all' && (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                    {filteredFolders.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground italic border border-border border-dashed rounded-xl col-span-full select-none text-xs">
                        No directories match your search criteria.
                      </div>
                    ) : (
                      filteredFolders.map((fol) => {
                        const folderActiveCount = fol.files ? fol.files.filter(f => f.status !== 'ARCHIVED').length : 0;
                        const folderSize = fol.files ? fol.files.reduce((sum, file) => sum + file.fileSize, 0) : 0;
                        return (
                          <div
                            key={fol.id}
                            onClick={() => handleSelectFolder(fol.id)}
                            className="p-5 bg-card border border-border hover:border-primary/40 rounded-xl space-y-4 cursor-pointer transition-all duration-200 relative group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                                <Folder className="h-8 w-8 text-primary" />
                              </div>
                              <button
                                onClick={(e) => handleDeleteFolder(e, fol.id, fol.name)}
                                className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded transition-all cursor-pointer"
                                title={`Delete ${fol.name} Folder`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground text-sm leading-snug truncate pr-2">
                                {fol.name}
                              </h3>
                              <span className="text-[10px] text-muted-foreground mt-1 block">
                                {folderActiveCount} Files • {formatBytes(folderSize)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/10 text-[10px] uppercase font-bold text-muted-foreground">
                          <th className="p-3">Folder Name</th>
                          <th className="p-3">File Count</th>
                          <th className="p-3">Folder Size</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs">
                        {filteredFolders.map((fol) => {
                          const folderActiveCount = fol.files ? fol.files.filter(f => f.status !== 'ARCHIVED').length : 0;
                          const folderSize = fol.files ? fol.files.reduce((sum, file) => sum + file.fileSize, 0) : 0;
                          return (
                            <tr key={fol.id} className="hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => handleSelectFolder(fol.id)}>
                              <td className="p-3 font-bold text-foreground flex items-center gap-2">
                                <Folder className="h-4 w-4 text-slate-400 shrink-0" />
                                <span>{fol.name}</span>
                              </td>
                              <td className="p-3 text-slate-500 font-semibold">{folderActiveCount} Files</td>
                              <td className="p-3 text-slate-500 font-semibold">{formatBytes(folderSize)}</td>
                              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => handleDeleteFolder(e, fol.id, fol.name)}
                                  className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded"
                                  title="Delete folder"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* VIEW 2: Files display (Selected folder or Shortcuts) */}
            {(selectedFolderId || sidebarShortcut !== 'all') && (
              <>
                <div className="space-y-4">
                  {selectedFolderId && (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (viewingSubfolder) {
                            setViewingSubfolder(null);
                          } else {
                            handleSelectFolder(null);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground font-semibold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Back to {viewingSubfolder ? activeFolder?.name : 'Directories'}</span>
                      </button>
                    </div>
                  )}

                  {viewMode === 'grid' ? (
                    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                      {/* System directories shown inside active folder view context */}
                      {selectedFolderId && !viewingSubfolder && (
                        <>
                          <div 
                            onClick={() => setViewingSubfolder('archive')}
                            className="p-5 bg-card border border-border hover:border-primary/40 rounded-xl space-y-4 cursor-pointer transition-all duration-200 relative group flex flex-col justify-between"
                          >
                            <div className="p-3 bg-amber-500/5 rounded-xl text-amber-500 w-fit shrink-0">
                              <FolderArchive className="h-8 w-8 text-amber-500" />
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground text-sm leading-snug">archive</h3>
                              <span className="text-[10px] text-muted-foreground mt-1 block">
                                System Archives Folder • {archiveFilesCount} Files
                              </span>
                            </div>
                          </div>

                          <div 
                            onClick={() => setViewingSubfolder('failure')}
                            className="p-5 bg-card border border-border hover:border-primary/40 rounded-xl space-y-4 cursor-pointer transition-all duration-200 relative group flex flex-col justify-between"
                          >
                            <div className="p-3 bg-rose-500/5 rounded-xl text-rose-500 w-fit shrink-0">
                              <Folder className="h-8 w-8 text-rose-500" />
                            </div>
                            <div>
                              <h3 className="font-bold text-rose-500 text-sm leading-snug">failure</h3>
                              <span className="text-[10px] text-muted-foreground mt-1 block">
                                System Failures Folder • {failureFilesCount} Files
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {filteredFiles.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground italic border border-border border-dashed rounded-xl col-span-full select-none text-xs">
                          No payloads match your search query.
                        </div>
                      ) : (
                        filteredFiles.map((file) => {
                          const info = getFileIconAndBadge(file.fileName);
                          return (
                            <div
                              key={file.id}
                              className="p-5 bg-card border border-border/80 hover:border-primary/40 rounded-xl flex flex-col justify-between space-y-4 transition-all duration-200 group relative"
                            >
                              <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-xl ${info.theme} shrink-0`}>
                                  {info.icon}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded ${info.badgeTheme}`}>
                                    {info.badge}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-foreground text-xs leading-snug truncate" title={file.fileName}>
                                  {file.fileName}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatBytes(file.fileSize)}
                                  </span>
                                  <span className="text-[10px] text-slate-300">•</span>
                                  {getStatusBadge(file.status)}
                                </div>
                              </div>

                              <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                                <span className="text-[9px] text-muted-foreground">
                                  {formatTimestamp(file.createdAt)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => handleCopyFileName(e, file.fileName)}
                                    className="p-1 hover:bg-muted text-muted-foreground hover:text-primary rounded"
                                    title="Copy Filename"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedFileMetadata(file)}
                                    className="p-1 hover:bg-muted text-muted-foreground hover:text-primary rounded"
                                    title="Metadata Info"
                                  >
                                    <Database className="h-3 w-3" />
                                  </button>
                                  {getFileSubfolder(file) === 'root' && (
                                    <button
                                      onClick={() => handleArchiveFile(file.id)}
                                      className="p-1 hover:bg-muted text-muted-foreground hover:text-primary rounded"
                                      title="Archive File"
                                    >
                                      <Archive className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden bg-card">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/10 text-[10px] uppercase font-bold text-muted-foreground">
                            <th className="p-3">File Name</th>
                            <th className="p-3">File Size</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Ingested At</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-xs">
                          {/* Render Archive Folder row only when viewing active files */}
                          {selectedFolderId && !viewingSubfolder && (
                            <tr className="hover:bg-muted/10 transition-colors font-bold text-foreground bg-muted/5">
                              <td className="p-3 flex items-center gap-2.5">
                                <FolderArchive className="h-4 w-4 text-amber-500 shrink-0" />
                                <span className="cursor-pointer hover:underline" onClick={() => setViewingSubfolder('archive')}>archive</span>
                              </td>
                              <td className="p-3 text-slate-500">--</td>
                              <td className="p-3 font-mono text-[10px] text-muted-foreground">System Folder</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[9px] font-extrabold uppercase">
                                  {archiveFilesCount} Files
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground">--</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setViewingSubfolder('archive')}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background border border-border hover:bg-muted text-foreground font-semibold rounded text-[10px] cursor-pointer shadow-sm"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Open Archive</span>
                                </button>
                              </td>
                            </tr>
                          )}

                          {/* Render Failure Folder row only when viewing active files */}
                          {selectedFolderId && !viewingSubfolder && (
                            <tr className="hover:bg-muted/10 transition-colors font-bold text-foreground bg-muted/5">
                              <td className="p-3 flex items-center gap-2.5">
                                <Folder className="h-4 w-4 text-rose-500 shrink-0" />
                                <span className="cursor-pointer hover:underline text-rose-600 dark:text-rose-400" onClick={() => setViewingSubfolder('failure')}>failure</span>
                              </td>
                              <td className="p-3 text-slate-500">--</td>
                              <td className="p-3 font-mono text-[10px] text-muted-foreground">System Folder</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[9px] font-extrabold uppercase">
                                  {failureFilesCount} Files
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground">--</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setViewingSubfolder('failure')}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background border border-border hover:bg-muted text-foreground font-semibold rounded text-[10px] cursor-pointer shadow-sm"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Open Failure</span>
                                </button>
                              </td>
                            </tr>
                          )}

                          {/* Render Files */}
                          {filteredFiles.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-muted-foreground italic">
                                No payloads match your search query.
                              </td>
                            </tr>
                          ) : (
                            filteredFiles.map((file) => (
                              <tr key={file.id} className="hover:bg-muted/10 transition-colors">
                                <td className="p-3 max-w-[200px]">
                                  <div className="flex items-center gap-1.5">
                                    <div className="font-bold text-foreground truncate" title={file.fileName}>{file.fileName}</div>
                                    <button
                                      onClick={(e) => handleCopyFileName(e, file.fileName)}
                                      className="p-0.5 hover:bg-muted text-muted-foreground hover:text-primary rounded cursor-pointer"
                                      title="Copy filename"
                                    >
                                      <Copy className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 font-semibold text-slate-500">
                                  {formatBytes(file.fileSize)}
                                </td>
                                <td className="p-3 font-mono text-[10px] text-muted-foreground">
                                  {file.contentType}
                                </td>
                                <td className="p-3">
                                  {getStatusBadge(file.status)}
                                </td>
                                <td className="p-3 font-medium text-muted-foreground">
                                  {formatTimestamp(file.createdAt)}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedFileMetadata(file)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-background border border-border hover:bg-muted text-foreground font-semibold rounded text-[10px] cursor-pointer shadow-sm"
                                      title="View Database Metadata Schema"
                                    >
                                      <Database className="h-3 w-3" />
                                      <span>Metadata</span>
                                    </button>

                                    {getFileSubfolder(file) === 'root' && (
                                      <button
                                        onClick={() => handleArchiveFile(file.id)}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-background border border-border hover:bg-muted text-foreground font-semibold rounded text-[10px] cursor-pointer shadow-sm"
                                        title="Move to Archives"
                                      >
                                        <Archive className="h-3 w-3 text-muted-foreground" />
                                        <span>Archive</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 3: Upload Side Drawer overlay */}
      {showUploadDrawer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-[9999] transition-all select-none">
          <div className="w-full max-w-lg bg-card border-l border-border h-full flex flex-col shadow-2xl relative p-5">
            <div className="flex justify-between items-center border-b border-border/60 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Upload Data Payload</h3>
              </div>
              <button 
                onClick={() => {
                  if (!uploading) {
                    setShowUploadDrawer(false);
                    setUploadFile(null);
                  }
                }}
                disabled={uploading}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-5">
              {/* Selector standard / chunk uploads */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Ingestion Strategy</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode('STANDARD')}
                    disabled={uploading}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none
                      ${uploadMode === 'STANDARD'
                        ? 'border-primary bg-primary/[0.03] text-primary font-bold'
                        : 'border-border bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                      }
                    `}
                  >
                    <span className="font-bold text-xs block">Standard Upload</span>
                    <span className="text-[9px] mt-1 block leading-normal opacity-80">Direct REST upload for payloads under 5MB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('CHUNK')}
                    disabled={uploading}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none
                      ${uploadMode === 'CHUNK'
                        ? 'border-primary bg-primary/[0.03] text-primary font-bold'
                        : 'border-border bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                      }
                    `}
                  >
                    <span className="font-bold text-xs block">Chunked Upload</span>
                    <span className="text-[9px] mt-1 block leading-normal opacity-80">Streamed chunk upload for large datasets</span>
                  </button>
                </div>
              </div>

              {/* Drag/drop input file selection box */}
              <div className="border border-border/85 border-dashed bg-muted/5 rounded-lg p-6 flex flex-col items-center justify-center text-center relative hover:bg-muted/10 transition-colors h-40">
                <input 
                  type="file" 
                  id="drawer-file-select"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                
                {uploadFile ? (
                  <div>
                    <span className="text-xs font-bold text-foreground block max-w-[280px] truncate">{uploadFile.name}</span>
                    <span className="text-[10px] text-muted-foreground block mt-1">{formatBytes(uploadFile.size)}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-foreground block">Select XML or CSV Payload</span>
                    <span className="text-[9px] text-muted-foreground block mt-1">Upload imports to target parsing pipelines</span>
                  </div>
                )}
              </div>

              {/* Uploading progress bars */}
              {uploading && uploadMode === 'STANDARD' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500">Uploading File...</span>
                    <span className="text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted border border-border/80 h-2 rounded overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* API chunk upload simulator visual status tracker */}
              {uploadMode === 'CHUNK' && uploading && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Uploading chunk payloads...</span>
                    <span className="text-primary font-bold">
                      {uploadedChunks} / 5 completed
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {[0, 1, 2, 3, 4].map((c) => {
                      const isCompleted = c < uploadedChunks;
                      const isActive = c === uploadedChunks && uploading;
                      const isPending = c > uploadedChunks;
                      
                      return (
                        <div
                          key={c}
                          className={`flex items-center justify-between p-3.5 border rounded-xl transition-all duration-200
                            ${isCompleted 
                              ? 'bg-emerald-500/[0.03] border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
                              : isActive 
                                ? 'bg-primary/[0.03] border-primary/25 text-primary animate-pulse-slow font-semibold' 
                                : 'bg-transparent border-border text-muted-foreground'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full
                              ${isCompleted 
                                ? 'bg-emerald-500' 
                                : isActive 
                                  ? 'bg-primary animate-ping' 
                                  : 'bg-slate-300'
                              }
                            `} />
                            <span className="font-bold text-xs">Chunk Core Payload #{c + 1}</span>
                          </div>
                          
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {isCompleted ? 'Verified' : isActive ? 'Uploading...' : 'Waiting'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {uploadFile && (
              <div className="pt-3 border-t border-border/60 shrink-0">
                <button
                  onClick={uploadMode === 'STANDARD' ? runStandardUpload : runChunkUpload}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{uploading ? 'Processing API requests...' : `Start ${uploadMode === 'STANDARD' ? 'Standard' : 'Chunked'} Upload`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: Metadata Inspector Drawer Sheet */}
      {selectedFileMetadata && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-end z-[9999] transition-all select-none">
          <div className="w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl relative p-5">
            <div className="flex justify-between items-center border-b border-border/60 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">File Database Metadata Schema</h3>
              </div>
              <button 
                onClick={() => setSelectedFileMetadata(null)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4 text-xs">
              <div className="flex items-center gap-2.5 p-3.5 bg-accent/20 border border-border/40 rounded-xl text-xs text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <div>
                  Review exact database fields mapped in <code>FileMetadata</code> entity schema.
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">File Name</span>
                  <span className="text-foreground font-bold">{selectedFileMetadata.fileName}</span>
                </div>

                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">File Ingestion ID</span>
                  <code className="text-[10px] font-mono text-primary font-bold">{selectedFileMetadata.id}</code>
                </div>

                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Content Type</span>
                  <code className="text-[10px] font-mono text-foreground font-bold">{selectedFileMetadata.contentType}</code>
                </div>

                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">File Size</span>
                  <span className="text-foreground font-semibold">{formatBytes(selectedFileMetadata.fileSize)} ({selectedFileMetadata.fileSize} Bytes)</span>
                </div>

                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Checksum digest</span>
                  <code className="text-[10px] font-mono text-foreground">{selectedFileMetadata.checksum}</code>
                </div>

                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ingestion Status</span>
                  <div>{getStatusBadge(selectedFileMetadata.status)}</div>
                </div>

                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Core Storage Path</span>
                  <code className="text-[10px] font-mono text-foreground leading-normal">{selectedFileMetadata.storagePath}</code>
                </div>

                <div className="flex flex-col gap-1 border-b border-border/30 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ingested At</span>
                  <span className="text-foreground font-semibold">{formatTimestamp(selectedFileMetadata.createdAt)}</span>
                </div>

                {selectedFileMetadata.errorMessage && (
                  <div className="flex flex-col gap-1.5 p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest">Ingestion Error Log</span>
                    <p className="text-[11px] font-mono leading-relaxed text-red-600 dark:text-red-400 select-text">{selectedFileMetadata.errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal dialog */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] transition-all">
          <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-5 space-y-4 relative select-none">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground">Create New Ingestion Folder</h3>
              <button 
                onClick={() => setShowFolderModal(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Folder Name</label>
                <input 
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. customer_billing"
                  className="px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
                <span className="text-[9px] text-muted-foreground mt-0.5 leading-normal">Creating a folder automatically registers corresponding directory path mapping on the core storage root.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-3 py-1.5 border border-border text-foreground hover:bg-muted font-semibold rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all cursor-pointer shadow-sm"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
