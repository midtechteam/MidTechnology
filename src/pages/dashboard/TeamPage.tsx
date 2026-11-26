import React from 'react';
import { Users, UserPlus, Shield, Mail } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function TeamPage() {
  const { user, profile } = useAuthStore();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspace Team</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members, roles, and collaborative workspace permissions.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-scafbind-purple text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-xs">
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span>Member</span>
          <span>Role</span>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-scafbind-purple text-white flex items-center justify-center font-bold text-sm">
                {(profile?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{profile?.name || 'Current User'} (You)</p>
                <p className="text-xs text-gray-400">{user?.email || 'user@scafbind.com'}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-purple-50 text-scafbind-purple text-xs font-semibold rounded-full">
              Owner
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
