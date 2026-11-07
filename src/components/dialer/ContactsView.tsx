import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Phone, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  Mail, 
  Building, 
  X, 
  Check, 
  Bot,
  FileText
} from 'lucide-react';
import { Contact } from '../../types/telephony.ts';
import { dtmfAudio } from '../../services/dtmfAudio.ts';

interface ContactsViewProps {
  contacts: Contact[];
  onCallContact: (contact: Contact) => void;
  onScreenContact: (contact: Contact) => void;
  onAddContact: (newContact: Contact) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  onCallContact,
  onScreenContact,
  onAddContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Contact form state
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.number.includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  // Group by favorites and alphabetical
  const favorites = filteredContacts.filter((c) => c.isFavorite);
  const regularContacts = filteredContacts.filter((c) => !c.isFavorite);

  const handleSaveNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNumber.trim()) return;

    const gradients = [
      'from-cyan-500 to-blue-600',
      'from-emerald-400 to-teal-600',
      'from-violet-500 to-purple-700',
      'from-amber-400 to-orange-600',
      'from-fuchsia-500 to-pink-600',
    ];
    const randomGrad = gradients[Math.floor(Math.random() * gradients.length)];

    const created: Contact = {
      id: `contact-${Date.now()}`,
      name: newName.trim(),
      number: newNumber.trim(),
      company: newCompany.trim() || undefined,
      notes: newNotes.trim() || undefined,
      avatarGradient: randomGrad,
      isFavorite: false,
      e2ee: true,
      lastCalled: 'Never',
    };

    onAddContact(created);
    setIsAddModalOpen(false);
    setNewName('');
    setNewNumber('');
    setNewCompany('');
    setNewNotes('');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-xl mx-auto px-4 py-2 select-none">
      {/* Search Bar & Add Contact Action */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name, company, or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95 transition-all shrink-0"
          title="Add New Contact"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Favorites Quick Dial Bar (if any) */}
      {favorites.length > 0 && !searchQuery && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 mb-2 px-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>Speed-Dial VIP Favorites</span>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-1">
            {favorites.map((fav) => (
              <button
                key={fav.id}
                onClick={() => setSelectedContact(fav)}
                className="flex flex-col items-center p-2 rounded-2xl hyperos-glass-card hover:border-cyan-400/40 min-w-[76px] transition-all group active:scale-95 shadow-md"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${fav.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-lg mb-1.5`}>
                  {fav.name.charAt(0)}
                </div>
                <span className="text-[11px] font-medium text-white group-hover:text-cyan-300 truncate max-w-[70px]">
                  {fav.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-mono text-slate-400 truncate max-w-[70px]">
                  {fav.company?.split(' ')[0] || 'Mobile'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Directory List */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        <div className="text-[11px] font-mono text-slate-500 px-1 py-1">
          <span>All Contacts ({filteredContacts.length})</span>
        </div>

        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => setSelectedContact(contact)}
            className="hyperos-glass-card rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-cyan-400/30 active:scale-[0.99] transition-all group shadow-md"
          >
            {/* Avatar & Details */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${contact.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
                {contact.name.charAt(0)}
              </div>

              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {contact.name}
                  </h3>
                  {contact.e2ee && (
                    <span title="E2EE WebRTC Verified" className="shrink-0 flex items-center">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    </span>
                  )}
                  {contact.isFavorite && (
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {contact.number}
                </p>

                {contact.company && (
                  <p className="text-[10px] text-slate-500 truncate">
                    {contact.company}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onScreenContact(contact);
                }}
                className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-cyan-600/30 border border-white/10 hover:border-cyan-400/50 text-slate-400 hover:text-cyan-300 flex items-center justify-center transition-all active:scale-90"
                title="Screen with AI"
              >
                <Bot className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dtmfAudio.playTone(700, 50, 0.08);
                  onCallContact(contact);
                }}
                className="w-8 h-8 rounded-full hyperos-call-btn text-white flex items-center justify-center transition-all active:scale-90"
                title="Call Contact"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            No contacts found matching &ldquo;{searchQuery}&rdquo;.
          </div>
        )}
      </div>

      {/* Contact Details Inspection Drawer */}
      {selectedContact && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedContact(null)}
        >
          <div 
            className="w-full max-w-sm hyperos-glass-card rounded-3xl p-5 shadow-2xl border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedContact(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center -mt-2 mb-4">
              <div className={`w-16 h-16 rounded-3xl bg-gradient-to-tr ${selectedContact.avatarGradient} flex items-center justify-center text-white font-bold text-2xl shadow-xl mb-3`}>
                {selectedContact.name.charAt(0)}
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{selectedContact.name}</span>
                {selectedContact.e2ee && (
                  <span title="End-to-End Encrypted Line" className="shrink-0 flex items-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </span>
                )}
              </h3>
              <p className="text-xs font-mono text-cyan-400 mt-0.5">{selectedContact.number}</p>
              {selectedContact.company && (
                <p className="text-xs text-slate-400 mt-0.5">{selectedContact.company}</p>
              )}
            </div>

            {/* AI Notes & Telemetry */}
            {selectedContact.notes && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 mb-4 text-left">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 mb-1">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Contact Intelligence & Bio</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedContact.notes}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  const c = selectedContact;
                  setSelectedContact(null);
                  onScreenContact(c);
                }}
                className="py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Bot className="w-4 h-4" />
                <span>Screen Call</span>
              </button>

              <button
                onClick={() => {
                  const c = selectedContact;
                  setSelectedContact(null);
                  onCallContact(c);
                }}
                className="py-2.5 rounded-xl hyperos-call-btn text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg"
              >
                <Phone className="w-4 h-4" />
                <span>Call Directly</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <form 
            onSubmit={handleSaveNewContact}
            className="w-full max-w-sm hyperos-glass-card rounded-3xl p-5 shadow-2xl border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Add WebRTC Contact</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 mb-1 block">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="e.g. +1 (555) 019-4821"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 mb-1 block">Company / Department</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. AI Architecture Group"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 mb-1 block">AI Notes / Description</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Senior dev leading mobile audio streaming."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg"
              >
                Save Contact
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
