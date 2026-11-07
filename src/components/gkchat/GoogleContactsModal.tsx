import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  Phone,
  Mail,
  Lock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  googleContactsService,
  GoogleContactPerson,
} from '../../services/googleContactsService.ts';
import { gkMessengerService } from '../../services/gkMessengerService.ts';

interface GoogleContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactsImported?: (count: number) => void;
}

export function GoogleContactsModal({
  isOpen,
  onClose,
  onContactsImported,
}: GoogleContactsModalProps) {
  const [currentUser, setCurrentUser] = useState(googleContactsService.getCurrentUser());
  const [token, setToken] = useState<string | null>(googleContactsService.getAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [googleContacts, setGoogleContacts] = useState<GoogleContactPerson[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Quick Add Real Contact to Google
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Subscribe to auth changes
  useEffect(() => {
    return googleContactsService.subscribeAuth((user, accessToken) => {
      setCurrentUser(user);
      setToken(accessToken);
    });
  }, []);

  // Fetch contacts automatically when token is available and modal is open
  useEffect(() => {
    if (isOpen && token) {
      loadContacts();
    }
  }, [isOpen, token]);

  const loadContacts = async () => {
    setIsLoadingContacts(true);
    setStatusMessage(null);
    try {
      const contacts = await googleContactsService.fetchContacts();
      setGoogleContacts(contacts);
      // Select all by default
      const allIds = new Set(contacts.map((c) => c.id));
      setSelectedIds(allIds);
      if (contacts.length === 0) {
        setStatusMessage({
          type: 'info',
          text: 'Google Contacts connected successfully, but no contacts were found in this Google account yet. You can add one below!',
        });
      }
    } catch (err: any) {
      console.error('Failed to load contacts:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to fetch contacts from Google People API.',
      });
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const res = await googleContactsService.signIn();
      setCurrentUser(res.user);
      setToken(res.accessToken);
      // After sign-in, load contacts
      await loadContacts();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Sign in was cancelled or encountered an issue.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await googleContactsService.signOut();
    setGoogleContacts([]);
    setSelectedIds(new Set());
    setStatusMessage({
      type: 'info',
      text: 'Signed out of Google Contacts.',
    });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const handleImportSelected = () => {
    const toImport = googleContacts.filter((c) => selectedIds.has(c.id));
    if (toImport.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Please select at least one contact to import.',
      });
      return;
    }

    const count = gkMessengerService.importGoogleContacts(toImport);
    setStatusMessage({
      type: 'success',
      text: `Successfully imported ${count} real contacts into GK-Chat!`,
    });
    if (onContactsImported) onContactsImported(count);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleCreateContactInGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setStatusMessage({ type: 'error', text: 'Name is required.' });
      return;
    }

    setIsAddingContact(true);
    setStatusMessage(null);
    try {
      const created = await googleContactsService.createContact({
        name: addName.trim(),
        phone: addPhone.trim() || undefined,
        email: addEmail.trim() || undefined,
      });

      // Also import into GK-Chat right away
      gkMessengerService.importGoogleContacts([created]);

      setStatusMessage({
        type: 'success',
        text: `Created "${created.name}" in Google Contacts and added to GK-Chat!`,
      });

      // Clear form
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      setShowAddForm(false);

      // Refresh list
      await loadContacts();
    } catch (err: any) {
      console.error('Error creating Google contact:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to create contact in Google Contacts.',
      });
    } finally {
      setIsAddingContact(false);
    }
  };

  const filteredContacts = googleContacts.filter((c) => {
    const q = searchFilter.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 liquid-glass-modal-backdrop animate-in fade-in select-none">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl liquid-glass-modal-container overflow-hidden text-slate-200">
        <div className="liquid-glass-modal-glare" />
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-gradient-to-r from-[#051336] via-[#040e24] to-[#051336] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Google Contacts Sync</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Real Contacts
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sync and message real contacts from your Google Workspace account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center gap-2 border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/80 text-rose-200 border-rose-500/30'
                : 'bg-cyan-950/80 text-cyan-200 border-cyan-500/30'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* If NOT signed in: Official Google Sign-In Screen */}
          {!token ? (
            <div className="py-8 px-4 flex flex-col items-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
              </div>

              <div className="max-w-md space-y-1.5">
                <h3 className="text-base font-bold text-white">Connect Google Contacts</h3>
                <p className="text-xs text-slate-400">
                  Authenticate with your Google account to grant permission to read and sync your
                  saved real contacts into GK-Chat for private P2P encrypted messaging and calling.
                </p>
              </div>

              {/* Official Google Material Button */}
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-3 px-6 py-3 rounded-full bg-white text-slate-800 font-semibold text-xs sm:text-sm hover:bg-slate-100 hover:shadow-lg active:scale-98 transition disabled:opacity-50"
              >
                {isSigningIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-600" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Tokens are cached securely in-memory. Zero credentials shared.</span>
              </div>
            </div>
          ) : (
            /* If Signed In: Account Info, Search Bar, Contact List, Add Contact */
            <>
              {/* Account Card */}
              <div className="p-3 rounded-2xl bg-[#081533] border border-cyan-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-9 h-9 rounded-full ring-2 ring-emerald-400/50 object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                      {currentUser?.displayName?.slice(0, 2).toUpperCase() || 'GC'}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser?.displayName || 'Google Account Connected'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={loadContacts}
                    disabled={isLoadingContacts}
                    className="p-1.5 rounded-xl bg-slate-900 border border-cyan-500/25 text-cyan-300 hover:bg-slate-800 transition"
                    title="Refresh Google Contacts"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingContacts ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-xl bg-slate-900 border border-rose-500/25 text-rose-300 hover:bg-rose-950/40 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Actions & Search */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search Google contacts by name, phone or email..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#081229] border border-cyan-500/25 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/20 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1"
                  >
                    {selectedIds.size === filteredContacts.length && filteredContacts.length > 0 ? (
                      <>
                        <Square className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Select All</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{showAddForm ? 'Close Form' : 'New Real Contact'}</span>
                  </button>
                </div>
              </div>

              {/* Add New Real Contact directly to Google */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateContactInGoogle}
                  className="p-3.5 rounded-2xl bg-[#06122d] border border-emerald-500/30 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Real Contact in Google Contacts</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Syncs immediately</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/25 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98480 00000"
                        value={addPhone}
                        onChange={(e) => setAddPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/25 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Email Address</label>
                      <input
                        type="email"
                        placeholder="user@gmail.com"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/25 text-white text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingContact}
                      className="px-4 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isAddingContact && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Save to Google & GK-Chat</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {isLoadingContacts ? (
                  <div className="py-10 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                    <p className="text-xs">Fetching real contacts from Google People API...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="py-8 px-4 rounded-2xl bg-slate-900/40 border border-dashed border-cyan-500/20 text-center space-y-3">
                    <Users className="w-8 h-8 text-slate-500 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-300">
                        {googleContacts.length === 0
                          ? 'Zero contacts found in this Google Account'
                          : 'No matching contacts found'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {googleContacts.length === 0
                          ? 'Click "+ New Real Contact" above to create real contacts in Google Contacts now.'
                          : 'Try adjusting your search query.'}
                      </p>
                    </div>

                    {googleContacts.length === 0 && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition"
                      >
                        + Add First Real Contact to Google
                      </button>
                    )}
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isSelected = selectedIds.has(contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => toggleSelect(contact.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm'
                            : 'bg-[#061129] border-cyan-500/10 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button
                            type="button"
                            className="text-slate-400 hover:text-white shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>

                          {contact.avatarUrl ? (
                            <img
                              src={contact.avatarUrl}
                              alt={contact.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-cyan-500/40 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                              {contact.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="truncate">
                            <h5 className="text-xs font-bold text-white truncate">{contact.name}</h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate">
                              {contact.phone && (
                                <span className="flex items-center gap-0.5 truncate">
                                  <Phone className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>{contact.phone}</span>
                                </span>
                              )}
                              {contact.email && (
                                <span className="flex items-center gap-0.5 truncate">
                                  <Mail className="w-2.5 h-2.5 text-cyan-400" />
                                  <span>{contact.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-cyan-500/20 text-cyan-300 shrink-0">
                          Google
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {token && (
          <div className="p-3.5 sm:p-4 border-t border-cyan-500/20 bg-[#030a1c] flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              <span className="font-bold text-white">{selectedIds.size}</span> contacts selected
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleImportSelected}
                disabled={selectedIds.size === 0}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 text-slate-950 text-xs font-black shadow-lg transition disabled:opacity-40 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Import {selectedIds.size} to GK-Chat</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
