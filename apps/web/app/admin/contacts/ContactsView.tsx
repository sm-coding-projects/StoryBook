'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Mail, UserCheck, Clock } from 'lucide-react';
import type { ContactRow } from './page';

export function ContactsView({ contacts }: { contacts: ContactRow[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  const active = contacts.filter(c => c.hasAccepted).length;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-end mb-16 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 uppercase">Contacts</h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mt-2">Manage your client relationships</p>
        </div>
        <div className="flex gap-10 text-right">
          <div>
            <p className="text-3xl font-bold">{contacts.length}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Clients</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{active}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Active</p>
          </div>
        </div>
      </header>

      {contacts.length === 0 ? (
        <div className="text-center py-32">
          <p className="text-[#999] font-black text-[10px] tracking-[0.3em] uppercase mb-4">
            No clients yet
          </p>
          <p className="text-gray-400 text-sm">
            Invite a client from any gallery editor and they will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 divide-y divide-gray-100">
          {contacts.map((contact) => (
            <div key={contact.email}>
              <button
                onClick={() => setExpanded(expanded === contact.email ? null : contact.email)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    contact.hasAccepted ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {contact.hasAccepted ? <UserCheck size={16} /> : <Clock size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{contact.email}</p>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-0.5">
                      {contact.invites.length} {contact.invites.length === 1 ? 'gallery' : 'galleries'}
                      {' · '}since {new Date(contact.firstInvitedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                    contact.hasAccepted ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {contact.hasAccepted ? 'Active' : 'Invited'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${expanded === contact.email ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {expanded === contact.email && (
                <div className="px-8 pb-6 pl-[88px]">
                  <ul className="space-y-2">
                    {contact.invites.map((inv, i) => (
                      <li key={i} className="flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => router.push(`/admin/editor/${inv.galleryId}`)}
                          className="font-bold uppercase tracking-widest text-gray-600 hover:text-black flex items-center gap-2"
                        >
                          <Mail size={12} /> {inv.galleryTitle}
                        </button>
                        <span className={`font-black uppercase tracking-wider text-[9px] px-2 py-1 ${
                          inv.status === 'accepted' ? 'bg-green-50 text-green-600' :
                          inv.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {inv.status}
                          {inv.acceptedAt && ` · ${new Date(inv.acceptedAt).toLocaleDateString()}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
