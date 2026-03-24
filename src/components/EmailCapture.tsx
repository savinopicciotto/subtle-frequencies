/**
 * Email capture component for waiting list
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'subtle-frequencies-waiting-list';

interface WaitingListEntry {
  email: string;
  timestamp: string;
  source?: string;
}

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Key listener for admin mode (Ctrl+Shift+E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        setShowAdmin(true);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if already submitted
  const hasSubmitted = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      const entries: WaitingListEntry[] = JSON.parse(stored);
      return entries.some(entry => entry.email === email && email !== '');
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (hasSubmitted()) {
      setError('You\'re already on the waiting list!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Load existing entries
      const stored = localStorage.getItem(STORAGE_KEY);
      const entries: WaitingListEntry[] = stored ? JSON.parse(stored) : [];

      // Add new entry
      const newEntry: WaitingListEntry = {
        email: email.trim(),
        timestamp: new Date().toISOString(),
        source: 'pwa',
      };

      entries.push(newEntry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

      // Success
      setIsSubmitted(true);
      setEmail('');
      
      // Reset after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error('Failed to save email:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin functions
  const getEntries = (): WaitingListEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const exportEntries = () => {
    const entries = getEntries();
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subtle-frequencies-waiting-list-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportEntriesCSV = () => {
    const entries = getEntries();
    const header = 'Email,Date,Source\n';
    const rows = entries
      .map(entry => {
        const date = new Date(entry.timestamp).toISOString().split('T')[0];
        const source = entry.source || 'pwa';
        return `${entry.email},${date},${source}`;
      })
      .join('\n');
    
    const csvContent = header + rows;
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subtle-frequencies-waiting-list-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearEntries = () => {
    if (confirm('Are you sure you want to clear all email entries?')) {
      localStorage.removeItem(STORAGE_KEY);
      setShowAdmin(false);
      alert('All entries cleared.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="glass-card p-6 space-y-4 text-center">
        <h3 className="text-xl font-display text-accent-gold">You're on the list!</h3>
        <p className="text-gray-300">
          Thank you! We'll email you when the official app store version is ready.
        </p>
        <p className="text-sm text-gray-500">
          You'll be first to know about new features and exclusive content.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-display mb-2">Join the Waiting List</h3>
        <p className="text-gray-400 text-sm">
          Get notified when the official app store version launches with exclusive features.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold/50"
            disabled={isSubmitting}
            required
          />
          <button
            type="submit"
            className="btn-primary px-6 py-3 rounded-xl font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Notify Me'}
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <p className="text-xs text-gray-500 text-center">
          No spam. We'll only email about app updates and new features.
          <br />
          Already have the app? You'll get early access to premium tiers.
        </p>
      </form>

      {/* Admin Panel (hidden) */}
      {showAdmin && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-accent-gold">Admin Panel</h4>
            <button
              onClick={() => setShowAdmin(false)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Close
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {getEntries().length} email(s) collected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={exportEntries}
                  className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg border border-white/20"
                >
                  Export JSON
                </button>
                <button
                  onClick={exportEntriesCSV}
                  className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg border border-white/20"
                >
                  Export CSV
                </button>
                <button
                  onClick={clearEntries}
                  className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            {getEntries().length > 0 && (
              <div className="max-h-40 overflow-y-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getEntries().map((entry, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="p-2 font-mono text-xs">{entry.email}</td>
                        <td className="p-2 text-gray-500">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}