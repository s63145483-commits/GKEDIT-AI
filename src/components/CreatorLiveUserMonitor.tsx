import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import {
  Users,
  Radio,
  Search,
  MapPin,
  Clock,
  Mail,
  ShieldAlert,
  Copy,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Activity,
  Filter,
  Eye,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  Wifi,
  Cpu,
  Layers,
  Terminal,
  Sparkles,
  Navigation,
  Info,
  Lock,
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  LayoutGrid,
  List,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../services/firebase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { isCreatorAdmin, getCreatorAdminEmail } from '../services/adminAuth.ts';
import { api } from '../services/api.ts';
import {
  behaviorModeService,
  BehaviorMode,
  UserBehaviorProfile,
  BEHAVIOR_METADATA,
} from '../services/behaviorModeService.ts';
import {
  adminAuditService,
  AdminAuditSessionRecord,
} from '../services/adminAuditService.ts';

export interface DetectedClientDevice {
  browser?: string;
  browserVersion?: string;
  os?: string;
  deviceType?: 'Desktop' | 'Mobile' | 'Tablet' | string;
  screenResolution?: string;
  viewportSize?: string;
  pixelRatio?: number;
  language?: string;
  timeZone?: string;
  onlineStatus?: string;
  connectionType?: string;
  cpuCores?: number;
  memoryGB?: number;
  touchSupport?: boolean;
  userAgent?: string;
}

export interface MonitoredUser {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    formatted?: string;
    source?: string;
  };
  device?: DetectedClientDevice;
  behaviorProfile?: UserBehaviorProfile;
  createdAt?: any;
  lastActive?: any;
}

export interface CreatorLiveUserMonitorProps {
  isOpen?: boolean;
  onClose?: () => void;
  asTab?: boolean;
}

export function CreatorLiveUserMonitor({ isOpen = true, onClose, asTab = false }: CreatorLiveUserMonitorProps) {
  const { user, firebaseUser } = useAuth();
  const currentEmail = firebaseUser?.email || user?.email;
  const isAuthorizedAdmin = isCreatorAdmin(currentEmail);

  // SECURE ADMIN ACCESS CONTROL:
  // If the authenticated user is NOT the configured creator admin, completely unmount/omit the component.
  if (!isAuthorizedAdmin || (!isOpen && !asTab)) {
    return null;
  }

  if (asTab) {
    return (
      <div
        className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 pb-24 text-slate-100"
        data-no-swipe="true"
      >
        <div
          style={{ background: 'rgba(15, 23, 42, 0.90)', backdropFilter: 'blur(16px)' }}
          className="relative w-full rounded-3xl border border-cyan-500/25 shadow-[0_0_50px_rgba(56,189,248,0.18)] flex flex-col text-slate-100 h-[calc(100vh-7.5rem)] min-h-[580px] overflow-hidden"
        >
          <CreatorLiveMonitorContent onClose={onClose || (() => {})} asTab={true} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      data-no-swipe="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        style={{ background: 'rgba(15, 23, 42, 0.94)', backdropFilter: 'blur(16px)' }}
        className="relative w-full max-w-5xl h-[94vh] sm:h-[90vh] rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(56,189,248,0.22)] flex flex-col overflow-hidden text-slate-100"
      >
        <CreatorLiveMonitorContent onClose={onClose || (() => {})} asTab={false} />
      </div>
    </div>
  );
}

function CreatorLiveMonitorContent({ onClose, asTab = false }: { onClose: () => void; asTab?: boolean }) {
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [selectedUser, setSelectedUser] = useState<MonitoredUser | null>(null);

  // Sub-tab state: 'users' or 'logs'
  const [monitorSubTab, setMonitorSubTab] = useState<'users' | 'logs'>('users');
  const [selectedBehaviorFilter, setSelectedBehaviorFilter] = useState<string>('all');
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // View mode: 'table' or 'cards' (defaults to cards on mobile for effortless vertical scrolling)
  const [userViewMode, setUserViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setUserViewMode('cards');
    }
  }, []);

  // Hidden Admin Security Audit Logging State
  const [activeAuditSession, setActiveAuditSession] = useState<AdminAuditSessionRecord | null>(null);
  const [auditSessions, setAuditSessions] = useState<AdminAuditSessionRecord[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Hidden Logging Utility:
  // Automatically logs admin access session on component mount with exact timestamp,
  // entry method (tab vs modal), device telemetry, and tracks dwell duration.
  useEffect(() => {
    let currentSessionId: string | null = null;
    adminAuditService
      .startAdminSession(asTab ? 'tab' : 'modal')
      .then((record) => {
        currentSessionId = record.sessionId;
        setActiveAuditSession(record);
      })
      .catch((err) => {
        console.warn('Hidden admin audit notice (handled):', err);
      });

    const unsubAuditStream = adminAuditService.subscribeToFirestoreAuditSessions((sessions) => {
      setAuditSessions(sessions);
    });

    return () => {
      unsubAuditStream();
      if (currentSessionId) {
        adminAuditService.closeAdminSession(currentSessionId);
      }
    };
  }, [asTab]);

  // Fetch server-side monitor logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.getCreatorMonitorLogs();
      if (res && Array.isArray(res.logs)) {
        setSystemLogs(res.logs);
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.warn('Failed to load monitor logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const timer = setInterval(fetchLogs, 8000);
    return () => clearInterval(timer);
  }, []);

  // Firestore Real-Time Subscription: users collection ordered by lastActive descending
  useEffect(() => {
    setLoading(true);
    setError(null);

    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy('lastActive', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userList: MonitoredUser[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          userList.push({
            id: docSnapshot.id,
            uid: data.uid || docSnapshot.id,
            displayName: data.displayName || data.name || 'Anonymous',
            email: data.email || 'No email attached',
            photoURL: data.photoURL || data.avatar,
            role: data.role || 'explorer',
            location: data.location,
            device: data.device,
            behaviorProfile: data.behaviorProfile,
            createdAt: data.createdAt,
            lastActive: data.lastActive,
          });
        });
        setUsers(userList);
        setLoading(false);
        setLastSyncTime(new Date());
      },
      (err) => {
        console.error('Firestore users onSnapshot error:', err);
        setError('Firestore permissions check: Access restricted or quota exceeded.');
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );

    return () => unsubscribe();
  }, []);

  // Keep selected user updated with real-time stream updates
  useEffect(() => {
    if (selectedUser) {
      const freshUser = users.find((u) => u.id === selectedUser.id);
      if (freshUser) {
        setSelectedUser(freshUser);
      }
    }
  }, [users]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const filteredUsers = useMemo(() => {
    let list = users;
    if (selectedBehaviorFilter !== 'all') {
      if (selectedBehaviorFilter === 'shifted') {
        list = list.filter(
          (u) =>
            u.behaviorProfile?.hasChanged ||
            (u.behaviorProfile?.recentShifts && u.behaviorProfile.recentShifts.length > 0)
        );
      } else {
        list = list.filter((u) => (u.behaviorProfile?.currentMode || 'normal') === selectedBehaviorFilter);
      }
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((u) => {
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const loc = (u.location?.formatted || u.location?.city || '').toLowerCase();
      const os = (u.device?.os || '').toLowerCase();
      const browser = (u.device?.browser || '').toLowerCase();
      const mode = (u.behaviorProfile?.currentMode || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        loc.includes(q) ||
        os.includes(q) ||
        browser.includes(q) ||
        mode.includes(q)
      );
    });
  }, [users, searchQuery, selectedBehaviorFilter]);

  // Compute active users within last 15 minutes
  const activeCount = useMemo(() => {
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    return users.filter((u) => {
      if (!u.lastActive) return false;
      let timeMs = 0;
      if (typeof u.lastActive.toDate === 'function') {
        timeMs = u.lastActive.toDate().getTime();
      } else if (typeof u.lastActive.seconds === 'number') {
        timeMs = u.lastActive.seconds * 1000;
      } else {
        timeMs = new Date(u.lastActive).getTime();
      }
      return timeMs >= fifteenMinsAgo;
    }).length;
  }, [users]);

  // Primary detected geographies
  const primaryGeos = useMemo(() => {
    const geos = new Set<string>();
    users.forEach((u) => {
      const loc = u.location?.city || u.location?.region || u.location?.formatted;
      if (loc && loc !== 'Unknown Location' && loc !== 'Global Network') {
        geos.add(loc);
      }
    });
    const list = Array.from(geos);
    return list.length > 0 ? list.slice(0, 4).join(', ') : 'Telangana, India • Global Network';
  }, [users]);

  // Filtered system logs
  const filteredLogs = useMemo(() => {
    return systemLogs.filter((log) => {
      if (selectedLogType !== 'all') {
        if (selectedLogType === 'admin_audit') {
          const isAudit =
            log.details?.category === 'admin_audit' ||
            (log.summary || '').toLowerCase().includes('admin access');
          if (!isAudit) return false;
        } else if (log.type !== selectedLogType) {
          return false;
        }
      }
      if (!logSearchQuery.trim()) return true;
      const q = logSearchQuery.toLowerCase().trim();
      const summary = (log.summary || '').toLowerCase();
      const email = (log.userEmail || '').toLowerCase();
      const name = (log.userName || '').toLowerCase();
      const details = log.details ? JSON.stringify(log.details).toLowerCase() : '';
      return summary.includes(q) || email.includes(q) || name.includes(q) || details.includes(q);
    });
  }, [systemLogs, selectedLogType, logSearchQuery]);

  function formatHumanTime(timestamp: any): string {
    if (!timestamp) return 'Just now';
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Just now';
    }

    if (isNaN(date.getTime())) return 'Recently';

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${hours}:${minutes}, ${day} ${month}`;
  }

  function isUserOnlineNow(timestamp: any): boolean {
    if (!timestamp) return false;
    let timeMs = 0;
    if (typeof timestamp.toDate === 'function') {
      timeMs = timestamp.toDate().getTime();
    } else if (typeof timestamp.seconds === 'number') {
      timeMs = timestamp.seconds * 1000;
    } else {
      timeMs = new Date(timestamp).getTime();
    }
    return Date.now() - timeMs < 10 * 60 * 1000; // online in last 10m
  }

  return (
    <>
      {/* Pinned Top Header */}
      <div className="shrink-0 p-4 sm:p-5 border-b border-cyan-500/20 bg-slate-900/95 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-[#38bdf8] flex items-center justify-center text-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.35)] shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>⚡ Creator Live User Monitor</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono font-bold">
                  MASTER ADMIN CONSOLE
                </span>
              </h2>
              {/* Dynamic Active Counter Badge */}
              <div className="px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>{users.length} Total</span>
                <span className="text-emerald-400/70">• {activeCount} Online</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin Authority: <strong className="text-cyan-300 font-mono">ROOT-CLEARANCE-LEVEL-5</strong> | Root Overseer (@GKEDIT2141)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => {
              fetchLogs();
              setLastSyncTime(new Date());
            }}
            disabled={logsLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-950/60 border border-cyan-500/25 text-cyan-400 hover:text-cyan-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Refresh Telemetry and Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700/80 text-slate-400 hover:text-red-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title={asTab ? 'Return to Dashboard' : 'Close Monitor'}
          >
            {asTab ? <ArrowLeft className="w-4 h-4 text-cyan-400" /> : <X className="w-4 h-4" />}
            <span>{asTab ? 'Dashboard' : 'Close'}</span>
          </button>
        </div>
      </div>

      {/* High-Performance Scrollable Monitor Body with Touch-Pan and Custom Scrollbar */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-950/40 hover:scrollbar-thumb-cyan-400/50 flex flex-col min-h-0"
        data-no-swipe="true"
      >
        {/* Master Admin Console Telemetry Strip */}
        <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-cyan-500/15 bg-slate-950/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">Admin Authority</span>
            <span className="font-bold text-white text-xs truncate">Root Overseer (@GKEDIT2141) • Clearance L5</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase">Active Connections</span>
            <span className="font-bold text-white text-xs">{users.length} Registered • {activeCount} Online</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">Primary Geographies</span>
            <span className="font-bold text-white text-xs truncate">{primaryGeos}</span>
          </div>
        </div>
        <div
          onClick={() => setIsAuditModalOpen(true)}
          className="p-2.5 rounded-xl bg-slate-900/70 border border-amber-500/25 hover:border-amber-400/60 flex items-center gap-2.5 transition cursor-pointer group shadow-[0_0_12px_rgba(251,191,36,0.12)]"
          title="Click to inspect full Admin Access Security Audit Trail"
        >
          <Lock className="w-5 h-5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-mono uppercase flex items-center gap-1">
              <span>Security Access Audit</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            </span>
            <span className="font-bold text-emerald-300 text-xs font-mono truncate block">
              {activeAuditSession?.openedAtFormatted ? activeAuditSession.openedAtFormatted.split(', ')[1] : 'Session Active'} • Audit Logged
            </span>
          </div>
        </div>
      </div>

      {/* Subtab Switcher (Sticky at top of scroll body) */}
      <div className="sticky top-0 z-10 px-4 sm:px-5 py-2.5 border-b border-cyan-500/20 bg-slate-950/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setMonitorSubTab('users')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              monitorSubTab === 'users'
                ? 'bg-cyan-500/20 text-[#38bdf8] border border-cyan-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Connected Users ({users.length})</span>
          </button>
          <button
            onClick={() => setMonitorSubTab('logs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              monitorSubTab === 'logs'
                ? 'bg-cyan-500/20 text-[#38bdf8] border border-cyan-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Interaction History & System Logs ({systemLogs.length})</span>
          </button>
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer bg-slate-900/80 text-amber-300 hover:text-amber-200 border border-amber-500/35 hover:border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.18)]"
            title="Inspect Admin Monitor Access Security Audit Log"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Audits ({auditSessions.length})</span>
          </button>
        </div>

        {/* View Mode Toggle for Users Subtab + Sync Time */}
        <div className="flex items-center gap-2.5">
          {monitorSubTab === 'users' && (
            <div className="flex items-center bg-slate-900/90 border border-cyan-500/30 rounded-xl p-0.5 shadow-[0_0_10px_rgba(56,189,248,0.15)]">
              <button
                onClick={() => setUserViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  userViewMode === 'cards'
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Card View: Vertical touch-friendly layout (best for mobile)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setUserViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  userViewMode === 'table'
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Table View: Full horizontal data grid"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          )}

          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            Synced: {lastSyncTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* SUBTAB 1: CONNECTED USERS VIEW */}
      {monitorSubTab === 'users' && (
        <>
          {/* Control Bar: Search and Quick Filters */}
          <div className="p-4 border-b border-cyan-500/15 bg-slate-900/60 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, location, mode, or OS..."
                  className="w-full bg-slate-950/80 border border-cyan-500/25 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8] transition"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-end">
                <span className="text-[11px] font-mono text-cyan-400">
                  Showing {filteredUsers.length} of {users.length} users
                </span>
              </div>
            </div>

            {/* Secret Behavior Mode Filter Bar (Creator Exclusive) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Behavior Mode:</span>
              </span>
              {[
                { id: 'all', label: 'All Users', icon: '🌐' },
                { id: 'shifted', label: '⚡ Mode Changed', icon: '⚡' },
                { id: 'dangerous', label: 'Dangerous', icon: '🚨' },
                { id: 'ultron', label: 'Ultron', icon: '🤖' },
                { id: 'cool', label: 'Cool', icon: '🕶️' },
                { id: 'childish', label: 'Childish', icon: '🎈' },
                { id: 'normal', label: 'Normal', icon: '🛡️' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedBehaviorFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    selectedBehaviorFilter === pill.id
                      ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{pill.icon}</span>
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Real-Time User Records List (Card Grid or Data Table) */}
          <div className="flex-1 min-h-0">
            {error ? (
              <div className="p-6 m-4 sm:m-5 rounded-2xl bg-red-950/50 border border-red-500/40 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-red-400 mx-auto" />
                <p className="text-red-300 font-bold text-sm">Security Alert</p>
                <p className="text-xs text-red-200/80">{error}</p>
              </div>
            ) : loading ? (
              /* Subtle Loading Skeleton States */
              <div className="p-4 sm:p-5 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-cyan-500/15 flex items-center justify-between gap-4 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800" />
                      <div className="space-y-1.5">
                        <div className="w-32 h-3.5 bg-slate-800 rounded" />
                        <div className="w-24 h-2.5 bg-slate-800/80 rounded" />
                      </div>
                    </div>
                    <div className="w-40 h-3 bg-slate-800 rounded hidden sm:block" />
                    <div className="w-28 h-3 bg-slate-800 rounded hidden md:block" />
                    <div className="w-20 h-3 bg-slate-800 rounded" />
                    <div className="w-24 h-8 bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">No matching user records detected</p>
                <p className="text-xs text-slate-500">
                  Users will appear here automatically in real time whenever they log in via Google Sign-In or Firebase Auth.
                </p>
              </div>
            ) : userViewMode === 'cards' ? (
              /* CARD GRID VIEW: Seamless, vertically scrollable cards optimized for mobile and touchscreen viewing */
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredUsers.map((u) => {
                  const isOnline = isUserOnlineNow(u.lastActive);
                  const avatarUrl =
                    u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.displayName)}`;
                  const bProfile = u.behaviorProfile;
                  const mode: BehaviorMode = bProfile?.currentMode || 'normal';
                  const meta = BEHAVIOR_METADATA[mode] || BEHAVIOR_METADATA.normal;
                  const hasChanged = bProfile?.hasChanged;
                  const prevMode = bProfile?.previousMode;

                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900/95 border border-cyan-500/20 hover:border-cyan-400/50 transition duration-150 flex flex-col justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.18)] group"
                    >
                      {/* Top Header: Avatar, Name, Role & Active Timestamp */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={avatarUrl}
                              alt={u.displayName}
                              className="w-11 h-11 rounded-2xl object-cover border border-cyan-500/35 bg-slate-950"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.displayName)}`;
                              }}
                            />
                            {isOnline && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                title="Active Now"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-sm truncate">
                                {u.displayName}
                              </span>
                              {u.role === 'creator' && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-bold font-mono">
                                  CREATOR
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-cyan-300/80 font-mono truncate">
                              <Mail className="w-3 h-3 shrink-0 text-cyan-400" />
                              <span className="truncate">{u.email}</span>
                              {u.email && u.email !== 'No email attached' && (
                                <button
                                  onClick={() => handleCopyEmail(u.email)}
                                  className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer shrink-0"
                                  title="Copy email"
                                >
                                  {copiedEmail === u.email ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Last Active Timestamp */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-500 font-mono block">Active</span>
                          <span className="text-[11px] font-mono font-bold text-slate-300">
                            {formatHumanTime(u.lastActive)}
                          </span>
                        </div>
                      </div>

                      {/* Middle Block: Secret Behavior Mode Status */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Behavior Mode</span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10.5px] font-mono font-bold ${meta.bg} ${meta.color} ${meta.border} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
                          >
                            <span>{meta.icon}</span>
                            <span>{meta.label.split(' ')[0]}</span>
                            {typeof bProfile?.confidence === 'number' && (
                              <span className="text-[9px] opacity-75">
                                ({Math.round(bProfile.confidence * 100)}%)
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Shift Detection Notice */}
                        {hasChanged && prevMode && prevMode !== mode ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 font-bold bg-amber-500/20 border border-amber-400/40 px-2 py-1 rounded-lg shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                            <span className="truncate">⚡ Shift: {prevMode.toUpperCase()} ➔ {mode.toUpperCase()}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span>✓</span> <span>Steady Persona</span>
                            </span>
                            {bProfile?.dailyHistory?.totalMessages ? (
                              <span className="text-slate-500">{bProfile.dailyHistory.totalMessages} msgs</span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer: Geography, Platform & Details Button */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
                        <div className="flex items-center gap-2 truncate text-slate-300 min-w-0">
                          <div className="flex items-center gap-1 truncate" title={u.location?.formatted || u.location?.city || 'Location unavailable'}>
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate text-[11px] font-medium">
                              {u.location?.city || u.location?.region || 'Global'}
                            </span>
                          </div>
                          <span className="text-slate-600 shrink-0">•</span>
                          <div className="flex items-center gap-1 shrink-0 text-slate-400 text-[11px]">
                            {u.device?.deviceType === 'Mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            ) : u.device?.deviceType === 'Tablet' ? (
                              <Tablet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            )}
                            <span className="truncate max-w-[80px]">{u.device?.os || 'Client'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedUser(u)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/40 hover:border-[#38bdf8] text-cyan-300 hover:text-white font-medium text-xs transition duration-150 shadow-[0_0_10px_rgba(56,189,248,0.15)] cursor-pointer shrink-0"
                          title={`View extended telemetry for ${u.displayName}`}
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW: Full horizontal data grid with sticky header and horizontal scroll */
              <div className="p-4 sm:p-5 overflow-x-auto scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-950/40">
                <div className="mb-2 sm:hidden flex items-center justify-between text-[11px] text-cyan-400/80 font-mono">
                  <span>← Swipe horizontally to see all columns →</span>
                </div>
                <div className="min-w-[850px] rounded-2xl border border-cyan-500/20 bg-slate-950/70 overflow-hidden shadow-lg">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md">
                      <tr className="border-b border-cyan-500/20 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Behavior & Mode Status</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Device / Platform</th>
                        <th className="py-3 px-4">Last Active</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredUsers.map((u) => {
                        const isOnline = isUserOnlineNow(u.lastActive);
                        const avatarUrl =
                          u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.displayName)}`;

                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-slate-900/80 transition-colors duration-150 group"
                          >
                            {/* Column 1: User (Avatar + Display Name) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <img
                                    src={avatarUrl}
                                    alt={u.displayName}
                                    className="w-10 h-10 rounded-full object-cover border border-cyan-500/30 bg-slate-900"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.displayName)}`;
                                    }}
                                  />
                                  {isOnline && (
                                    <span
                                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full"
                                      title="Active Now"
                                    />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-xs sm:text-sm">
                                      {u.displayName}
                                    </span>
                                    {u.role === 'creator' && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-bold font-mono">
                                        CREATOR
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                    <span>UID: {u.uid.slice(0, 10)}...</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Email */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-cyan-300 text-xs truncate max-w-[180px]" title={u.email}>
                                  {u.email}
                                </span>
                                {u.email && u.email !== 'No email attached' && (
                                  <button
                                    onClick={() => handleCopyEmail(u.email)}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition opacity-70 group-hover:opacity-100 cursor-pointer"
                                    title="Copy email"
                                  >
                                    {copiedEmail === u.email ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Column 3: Behavior Mode & Shift Status (Creator Only) */}
                            <td className="py-3.5 px-4">
                              {(() => {
                                const bProfile = u.behaviorProfile;
                                const mode: BehaviorMode = bProfile?.currentMode || 'normal';
                                const meta = BEHAVIOR_METADATA[mode] || BEHAVIOR_METADATA.normal;
                                const hasChanged = bProfile?.hasChanged;
                                const prevMode = bProfile?.previousMode;

                                return (
                                  <div className="space-y-1 max-w-[210px]">
                                    {/* Current Mode Badge */}
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10.5px] font-mono font-bold ${meta.bg} ${meta.color} ${meta.border} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
                                      >
                                        <span>{meta.icon}</span>
                                        <span>{meta.label.split(' ')[0]}</span>
                                        {typeof bProfile?.confidence === 'number' && (
                                          <span className="text-[9px] opacity-75">
                                            ({Math.round(bProfile.confidence * 100)}%)
                                          </span>
                                        )}
                                      </span>
                                    </div>

                                    {/* Shift Detection Notice */}
                                    {hasChanged && prevMode && prevMode !== mode ? (
                                      <div className="flex items-center gap-1 text-[9.5px] font-mono text-amber-300 font-bold bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                                        <span className="truncate">⚡ Shift: {prevMode.toUpperCase()} ➔ {mode.toUpperCase()}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-[9.5px] font-mono text-slate-400">
                                        <span className="text-emerald-400 font-bold">✓</span>
                                        <span>Mode Steady</span>
                                        {bProfile?.dailyHistory?.totalMessages ? (
                                          <span className="text-slate-500">• {bProfile.dailyHistory.totalMessages} msgs</span>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Column 4: Location (Pin + City/Region or Coordinates) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-1.5 max-w-[200px]">
                                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-slate-200 leading-tight">
                                    {u.location?.formatted || u.location?.city || 'Location unavailable'}
                                  </p>
                                  {u.location?.source && (
                                    <span className="text-[9px] text-slate-500 font-mono uppercase">
                                      [{u.location.source.toUpperCase()}]
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Column 5: Device / Platform */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                {u.device?.deviceType === 'Mobile' ? (
                                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                                ) : u.device?.deviceType === 'Tablet' ? (
                                  <Tablet className="w-4 h-4 text-cyan-400 shrink-0" />
                                ) : (
                                  <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                                )}
                                <div className="text-xs">
                                  <span className="font-medium text-slate-200 block">
                                    {u.device?.os || 'Client OS'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {u.device?.browser || 'Browser'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Column 6: Last Active */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="font-mono text-xs font-semibold">
                                  {formatHumanTime(u.lastActive)}
                                </span>
                              </div>
                            </td>

                            {/* Column 7: View Details Action */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-[#38bdf8] text-cyan-300 hover:text-white font-medium text-xs transition duration-150 shadow-[0_0_12px_rgba(56,189,248,0.12)] cursor-pointer group/btn"
                                title={`View extended metadata for ${u.displayName}`}
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400 group-hover/btn:scale-110 transition-transform" />
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* SUBTAB 2: INTERACTION HISTORY & SYSTEM LOGS VIEW */}
      {monitorSubTab === 'logs' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Controls: Search and Category Filter Pills */}
          <div className="p-4 border-b border-cyan-500/15 bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Search events, user emails, or actions..."
                className="w-full bg-slate-950/80 border border-cyan-500/25 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#38bdf8] transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'admin_audit', label: '🛡️ Admin Audits' },
                { id: 'auth', label: 'Auth' },
                { id: 'chat', label: 'Chat' },
                { id: 'generator', label: 'Studio' },
                { id: 'tool', label: 'Tool' },
                { id: 'system', label: 'System' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setSelectedLogType(pill.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedLogType === pill.id
                      ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logs List / Table */}
          <div className="p-4 sm:p-5 overflow-x-auto scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-950/40">
            {logsLoading && systemLogs.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-900/70 border border-cyan-500/15 flex items-center justify-between gap-4 animate-pulse"
                  >
                    <div className="w-28 h-3.5 bg-slate-800 rounded" />
                    <div className="w-48 h-3.5 bg-slate-800 rounded" />
                    <div className="w-64 h-3.5 bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">No matching system telemetry events found</p>
                <p className="text-xs text-slate-500">
                  User chats, logins, generator runs, and security audits appear here in real time.
                </p>
              </div>
            ) : (
              <div className="min-w-[760px] rounded-2xl border border-cyan-500/20 bg-slate-950/70 overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md">
                    <tr className="border-b border-cyan-500/20 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Event Summary</th>
                      <th className="py-3 px-4 text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const isAuditLog =
                        log.details?.category === 'admin_audit' ||
                        (log.summary || '').toLowerCase().includes('admin access');
                      const badgeColor = isAuditLog
                        ? 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                        : log.type === 'auth'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : log.type === 'chat'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                        : log.type === 'generator'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                        : log.type === 'tool'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-400/40';

                      return (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-slate-900/80 transition-colors duration-150">
                            {/* Time */}
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                              {formatHumanTime(log.timestamp)}
                            </td>

                            {/* Category badge */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${badgeColor}`}
                              >
                                {isAuditLog ? 'SECURITY AUDIT' : log.type}
                              </span>
                            </td>

                            {/* User */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="text-xs font-semibold text-white truncate max-w-[150px]">
                                {log.userName || 'Anonymous'}
                              </div>
                              <div className="text-[10px] text-cyan-400/80 font-mono truncate max-w-[150px]">
                                {log.userEmail || 'no-email'}
                              </div>
                            </td>

                            {/* Event Summary */}
                            <td className="py-3 px-4 text-slate-200 font-medium">
                              {log.summary}
                            </td>

                            {/* Payload Toggle */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {log.details ? (
                                <button
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-500/40 text-cyan-300 text-[11px] font-mono transition cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-3.5 h-3.5" />
                                      <span>Hide</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                      <span>Details</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-600 text-[11px] font-mono">—</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded JSON Inspector */}
                          {isExpanded && log.details && (
                            <tr className="bg-slate-950/90 border-b border-cyan-500/20">
                              <td colSpan={5} className="p-4">
                                <div className="p-3 rounded-xl bg-[#030712] border border-cyan-500/30 text-[11px] font-mono text-cyan-200 overflow-x-auto">
                                  <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* End of High-Performance Scrollable Monitor Body */}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-cyan-500/20 bg-slate-900/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
          <span>
            Admin Verification: <strong className="text-cyan-300 font-mono">Cryptographically Bound</strong> • Root Overseer (@GKEDIT2141)
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(56,189,248,0.35)] transition cursor-pointer"
        >
          {asTab ? 'Return to Dashboard' : 'Close Monitor'}
        </button>
      </div>

      {/* Extended Telemetry & Session Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Admin Access Security Audit Trail Modal */}
      {isAuditModalOpen && (
        <AdminAuditModal
          sessions={auditSessions}
          activeSession={activeAuditSession}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}
    </>
  );
}

/**
 * UserDetailsModal renders a deep glassmorphic panel exhibiting
 * comprehensive browser, OS, hardware, and geolocation metadata for a selected user.
 */
function UserDetailsModal({
  user,
  onClose,
}: {
  user: MonitoredUser;
  onClose: () => void;
}) {
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedUA, setCopiedUA] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleCopyUA = (uaString: string) => {
    navigator.clipboard.writeText(uaString);
    setCopiedUA(true);
    setTimeout(() => setCopiedUA(false), 2000);
  };

  const avatarUrl =
    user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.displayName)}`;

  const device = user.device;

  // Resolve Device Icon
  const renderDeviceIcon = () => {
    const type = device?.deviceType?.toLowerCase();
    if (type === 'mobile') return <Smartphone className="w-5 h-5 text-cyan-400" />;
    if (type === 'tablet') return <Tablet className="w-5 h-5 text-cyan-400" />;
    return <Laptop className="w-5 h-5 text-cyan-400" />;
  };

  function formatExactDate(timestamp: any): string {
    if (!timestamp) return 'Unavailable';
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp.seconds === 'number') {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  const hasCoords = user.location?.latitude != null && user.location?.longitude != null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${user.location?.latitude},${user.location?.longitude}`
    : null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(16px)',
        }}
        data-no-swipe="true"
        className="relative w-full max-w-3xl max-h-[92vh] rounded-3xl border border-cyan-500/35 shadow-[0_0_60px_rgba(56,189,248,0.22)] flex flex-col overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-cyan-500/20 bg-slate-900/90 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={user.displayName}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-[#38bdf8] bg-slate-900 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.displayName)}`;
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  {user.displayName}
                </h3>
                {user.role === 'creator' ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-[10px] font-bold">
                    ⚡ CREATOR ADMIN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                    EXPLORER
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-400/90 font-mono mt-0.5">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-mono">
                <span>UID: {user.uid}</span>
                <button
                  onClick={handleCopyUid}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                  title="Copy full UID"
                >
                  {copiedUid ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700/80 text-slate-400 hover:text-red-300 transition cursor-pointer shrink-0"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body with smooth touch scrolling and custom scrollbar */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-slate-950/40 p-5 sm:p-6 space-y-6">
          {/* CLASSIFIED SECTION: Secret Behavioral Intelligence & Daily Persona Sync */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.18)] space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white tracking-wide flex items-center gap-2">
                    <span>BEHAVIORAL INTELLIGENCE & PERSONA SYNC</span>
                    <span className="px-2 py-0.2 rounded-full bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 font-mono text-[9px] font-bold">
                      CONFIDENTIAL
                    </span>
                  </h4>
                  <p className="text-[10px] text-cyan-300/80 font-mono">
                    Silent Predictive Engine • Syncs AI Tone with Daily User Personality
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[10px] font-mono text-slate-400">
                ROOT OVERSEER EYES ONLY
              </span>
            </div>

            {user.behaviorProfile ? (
              <div className="space-y-4">
                {/* Active Mode & Shift Detection Banner */}
                {(() => {
                  const bProfile = user.behaviorProfile;
                  const mode: BehaviorMode = bProfile.currentMode || 'normal';
                  const meta = BEHAVIOR_METADATA[mode] || BEHAVIOR_METADATA.normal;
                  const hasChanged = bProfile.hasChanged;
                  const prevMode = bProfile.previousMode;

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Current Mode */}
                        <div className={`p-3.5 rounded-2xl border ${meta.bg} ${meta.border} space-y-1 sm:col-span-2`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-300">
                              Active Behavior Mode
                            </span>
                            {typeof bProfile.confidence === 'number' && (
                              <span className="text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                                {Math.round(bProfile.confidence * 100)}% Confidence
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-base font-black text-white">
                            <span className="text-2xl">{meta.icon}</span>
                            <span>{meta.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{meta.description}</p>
                        </div>

                        {/* Volatility & Shift Status */}
                        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 space-y-2 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                              Behavior Volatility
                            </span>
                            <span className="text-xs font-bold font-mono text-white capitalize flex items-center gap-1.5 mt-0.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  bProfile.volatility === 'volatile'
                                    ? 'bg-rose-400 animate-ping'
                                    : bProfile.volatility === 'shifting'
                                    ? 'bg-amber-400 animate-pulse'
                                    : 'bg-emerald-400'
                                }`}
                              />
                              <span>{bProfile.volatility || 'Stable'}</span>
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 block">Today's Shifts:</span>
                            <span className="text-xs font-bold font-mono text-cyan-300">
                              {bProfile.dailyHistory?.shiftsToday ?? 0} Mode Shift(s)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mode Shift Alert Notice */}
                      {hasChanged && prevMode && prevMode !== mode ? (
                        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center gap-2.5 text-xs text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                          <div className="flex-1 font-mono">
                            <strong className="text-white">⚡ ACTIVE MODE SHIFT:</strong> User transitioned from{' '}
                            <span className="text-amber-300 font-bold uppercase">{prevMode}</span> to{' '}
                            <span className="text-cyan-300 font-bold uppercase">{mode}</span>.
                            {bProfile.lastShiftAt && (
                              <span className="text-slate-400 text-[10px] block mt-0.5">
                                Shift timestamp: {new Date(bProfile.lastShiftAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-mono">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>✓ Mode Steady: User maintains consistent {mode.toUpperCase()} behavioral patterns.</span>
                        </div>
                      )}

                      {/* Daily Mode Sync Breakdown */}
                      {bProfile.dailyHistory && (
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/15 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-slate-400 uppercase text-[10px]">
                              Today's Behavioral Sync ({bProfile.dailyHistory.date})
                            </span>
                            <span className="font-mono text-cyan-300 text-[11px]">
                              Total: {bProfile.dailyHistory.totalMessages} Messages
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-2 text-center font-mono">
                            {(['normal', 'dangerous', 'cool', 'childish', 'ultron'] as BehaviorMode[]).map((m) => {
                              const metaInfo = BEHAVIOR_METADATA[m];
                              const count = bProfile.dailyHistory.modeCounts?.[m] || 0;
                              return (
                                <div
                                  key={m}
                                  className={`p-2 rounded-lg border text-xs ${metaInfo.bg} ${metaInfo.border}`}
                                >
                                  <div className="text-base">{metaInfo.icon}</div>
                                  <div className={`text-[10px] font-bold ${metaInfo.color} uppercase truncate`}>
                                    {m}
                                  </div>
                                  <div className="text-xs font-black text-white mt-0.5">{count}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Last Analyzed Message Snippet & Detection Rationale */}
                      {bProfile.lastMessageSnippet && (
                        <div className="p-3 rounded-xl bg-black/60 border border-slate-800 space-y-1.5 text-xs font-mono">
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span>LAST ANALYZED USER MESSAGE:</span>
                            <span className="text-cyan-400">Predicted Mode: {mode.toUpperCase()}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-950 text-slate-200 text-[11px] italic border border-white/5">
                            "{bProfile.lastMessageSnippet}"
                          </div>
                          {bProfile.changeNotice && (
                            <div className="text-[10px] text-cyan-300">
                              Classification Notice: {bProfile.changeNotice}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Recent Shifts Audit Trail */}
                      {bProfile.recentShifts && bProfile.recentShifts.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Recent Mode Shifts History:
                          </span>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {bProfile.recentShifts.map((shift, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[10.5px] font-mono"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="text-amber-400 font-bold">⚡</span>
                                  <span className="text-slate-300 uppercase">{shift.fromMode}</span>
                                  <span className="text-cyan-400">➔</span>
                                  <span className="text-white font-bold uppercase">{shift.toMode}</span>
                                </span>
                                <span className="text-slate-500 text-[9.5px]">
                                  {new Date(shift.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="py-6 px-4 rounded-xl bg-slate-900/50 border border-cyan-500/15 text-center space-y-2">
                <Activity className="w-7 h-7 text-cyan-400 mx-auto animate-pulse" />
                <p className="text-xs font-semibold text-slate-300">
                  Silent Behavioral Profile Standing By
                </p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Behavior prediction triggers automatically on the user's first chat prompt. The AI will categorize syntax into Normal, Dangerous, Cool, Childish, or Ultron and sync responses silently.
                </p>
              </div>
            )}
          </div>

          {/* Section 1: Browser & Operating System */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#38bdf8]" />
                <span>Operating System & Browser Environment</span>
              </h4>
              {device && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono">
                  Live Telemetry Captured
                </span>
              )}
            </div>

            {device ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Operating System */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    {renderDeviceIcon()}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">OS</span>
                    <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {device.os || 'Unknown OS'}
                    </span>
                  </div>
                </div>

                {/* Browser & Version */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Browser</span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate block" title={device.browser}>
                      {device.browser || 'Unknown'}
                    </span>
                    {device.browserVersion && (
                      <span className="text-[10px] text-cyan-400/80 font-mono block">
                        v{device.browserVersion}
                      </span>
                    )}
                  </div>
                </div>

                {/* Device Form Factor */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Form Factor</span>
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {device.deviceType || 'Desktop'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {device.touchSupport ? 'Touch Enabled' : 'Pointer / Mouse'}
                    </span>
                  </div>
                </div>

                {/* Connection Status */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Wifi className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Network</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 truncate block">
                      {device.onlineStatus || 'Online'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block" title={device.connectionType}>
                      {device.connectionType || 'High-speed'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
                <Info className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  Extended browser/OS telemetry is scheduled to synchronize automatically upon the user's next active interaction.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Display & Hardware Metrics */}
          {device && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#38bdf8]" />
                <span>Display & Hardware Specifications</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/15">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Screen Resolution</span>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {device.screenResolution || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/15">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Viewport Dimensions</span>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {device.viewportSize || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/15">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Pixel Ratio</span>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {device.pixelRatio ? `${device.pixelRatio}x DPR` : '1x DPR'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-cyan-500/15">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">CPU Threads & Memory</span>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono">
                    {device.cpuCores ? `${device.cpuCores} Threads` : 'Hardware Safe'}
                    {device.memoryGB ? ` • ${device.memoryGB}GB RAM` : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Geolocation & Regional Metadata */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Location & Network Geocoding</span>
            </h4>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">
                      {user.location?.formatted || 'Location data not resolved'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      {user.location?.city && <span>City: {user.location.city}</span>}
                      {user.location?.region && <span>• State: {user.location.region}</span>}
                      {user.location?.country && <span>• Country: {user.location.country}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {user.location?.source && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono uppercase">
                      Source: {user.location.source}
                    </span>
                  )}
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-medium transition cursor-pointer"
                    >
                      <span>Maps View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {hasCoords && (
                <div className="pt-2 border-t border-slate-800 flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Latitude: <strong className="text-cyan-300">{user.location?.latitude?.toFixed(5)}</strong></span>
                  <span>Longitude: <strong className="text-cyan-300">{user.location?.longitude?.toFixed(5)}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Locale & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Session Timezone</span>
                <span className="text-xs sm:text-sm font-bold text-white font-mono">
                  {device?.timeZone || 'UTC'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Terminal className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Client Language</span>
                <span className="text-xs sm:text-sm font-bold text-white font-mono">
                  {device?.language || 'en-US'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Raw User Agent */}
          {device?.userAgent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#38bdf8]" />
                  <span>Session User-Agent String</span>
                </h4>
                <button
                  onClick={() => handleCopyUA(device.userAgent || '')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-mono transition cursor-pointer"
                >
                  {copiedUA ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UA</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/20 text-[11px] font-mono text-slate-300 break-all leading-relaxed select-all">
                {device.userAgent}
              </div>
            </div>
          )}

          {/* Section 6: Session Audit Timestamps */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/15 space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#38bdf8]" />
              <span>Session Activity & Lifecycle Audit</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Account Created:</span>
                <span className="font-mono text-slate-200">{formatExactDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Last Active Ping:</span>
                <span className="font-mono text-cyan-300">{formatExactDate(user.lastActive)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-slate-900/90 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Document ID: <strong className="text-cyan-300">{user.id}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(56,189,248,0.35)] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminAuditModal renders a dedicated cybersecurity audit panel showcasing
 * immutable timestamps, dwell duration, and access telemetry for every admin access session.
 */
function AdminAuditModal({
  sessions,
  activeSession,
  onClose,
}: {
  sessions: AdminAuditSessionRecord[];
  activeSession: AdminAuditSessionRecord | null;
  onClose: () => void;
}) {
  const [copiedLog, setCopiedLog] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExportJson = () => {
    const payload = JSON.stringify(sessions, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gkedit-admin-security-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(sessions, null, 2));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const formatDuration = (sec: number = 0) => {
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${mins}m ${remSec}s`;
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
        }}
        data-no-swipe="true"
        className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border border-amber-500/35 shadow-[0_0_60px_rgba(251,191,36,0.18)] flex flex-col overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-amber-500/20 bg-slate-900/90 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.35)] shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                  <span>ADMIN ACCESS SECURITY AUDIT TRAIL</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-[9.5px] font-bold">
                    IMMUTABLE AUDIT LOG
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographically bound access logging • Tracks all administrator entries to Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition cursor-pointer font-mono"
              title="Download JSON audit export"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span> JSON
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-300 transition cursor-pointer"
              title="Close audit view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with smooth touch scrolling and custom scrollbar */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y scrollbar-thin scrollbar-thumb-amber-500/30 scrollbar-track-slate-950/40 p-5 sm:p-6 space-y-5">
          {/* Active Session Highlight Banner */}
          {activeSession && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 shadow-[0_0_20px_rgba(251,191,36,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>ACTIVE MONITOR ACCESS SESSION</span>
                    <span className="font-mono text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/40">
                      LIVE
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Session ID: <strong className="text-cyan-300">{activeSession.sessionId}</strong> • Started at {activeSession.openedAtFormatted}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono self-end sm:self-auto">
                <span className="text-slate-400">Entry Mode:</span>
                <span className="px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-cyan-300 font-bold uppercase">
                  {activeSession.accessMode} Interface
                </span>
              </div>
            </div>
          )}

          {/* Sessions Count & Security Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Recorded Access Sessions</span>
              <span className="text-base sm:text-lg font-black text-white font-mono">{sessions.length} Sessions</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Security Clearance</span>
              <span className="text-xs font-bold text-emerald-400 font-mono block">LEVEL 5 SOVEREIGN</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Audit Integrity Status</span>
              <span className="text-xs font-bold text-amber-300 font-mono block">Enforced & Immutable</span>
            </div>
          </div>

          {/* Audit Trail Sessions Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Recorded Admin Access Sessions History</span>
              </h4>
              <button
                onClick={handleCopyJson}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLog ? 'Copied' : 'Copy All'}</span>
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2 rounded-2xl bg-slate-950/50 border border-slate-800">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">No prior audit sessions captured yet</p>
                <p className="text-[11px] text-slate-500">Every admin access to the monitor tab is recorded automatically.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 overflow-hidden shadow-lg overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-cyan-500/20 bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                      <th className="py-3 px-4">Access Timestamp</th>
                      <th className="py-3 px-4">Entry Gateway</th>
                      <th className="py-3 px-4">Dwell Duration</th>
                      <th className="py-3 px-4">Client Environment</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                    {sessions.map((sess) => {
                      const isActive = sess.status === 'active' || sess.sessionId === activeSession?.sessionId;
                      return (
                        <tr key={sess.sessionId} className="hover:bg-slate-900/70 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-white font-bold">{sess.openedAtFormatted || sess.openedAt}</div>
                            <div className="text-[9.5px] text-slate-500">ID: {sess.sessionId}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] uppercase font-bold">
                              {sess.accessMode} Interface
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                            {isActive ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                <span>Active Now ({formatDuration(sess.durationSeconds)})</span>
                              </span>
                            ) : (
                              <span>{formatDuration(sess.durationSeconds)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[10.5px]">
                            <div>{sess.device?.os || 'OS'} • {sess.device?.browser || 'Browser'}</div>
                            <div className="text-[9px] text-slate-500">{sess.device?.screenResolution || ''}</div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[9.5px] font-bold uppercase ${
                                isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {isActive ? 'Active' : 'Archived'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-amber-500/20 bg-slate-900/90 flex items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <span>Security Protocol: Encrypted Local & Remote Audit Logging</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(251,191,36,0.35)] transition cursor-pointer"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
}
