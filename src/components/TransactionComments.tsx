'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User, Clock, Loader2, Paperclip, FileText, X } from 'lucide-react';
import { Comment, Attachment } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from '@/config';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TransactionCommentsProps {
  transactionId: string;
  currentUserRole: 'cpa' | 'client';
  currentUserName: string;
  currentUserId: string;
}

export default function TransactionComments({
  transactionId,
  currentUserRole,
  currentUserName,
  currentUserId,
}: TransactionCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComments();
  }, [transactionId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}/comments?user_id=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        // Map backend data to frontend Comment type
        // Backend: {id, transaction_id, user_id, content, attachments, created_at}
        const mappedComments: Comment[] = data.map((c: any) => ({
          id: c.id,
          transaction_id: c.transaction_id,
          user_id: c.user_id,
          user_name: c.user_id === currentUserId ? currentUserName : (currentUserRole === 'cpa' ? 'Client' : 'Sarah (CPA)'),
          user_role: c.user_id === currentUserId ? currentUserRole : (currentUserRole === 'cpa' ? 'client' : 'cpa'),
          text: c.content,
          attachments: c.attachments || [],
          created_at: c.created_at
        }));
        setComments(mappedComments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && pendingAttachments.length === 0) || submitting) return;

    setSubmitting(true);
    try {
      // Mock upload for each file
      const uploadedAttachments: Attachment[] = await Promise.all(
        pendingAttachments.map(async (file) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: '#', // In real app, this would be the S3 URL
          type: file.type
        }))
      );

      const res = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}/comments?user_id=${currentUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newComment || (uploadedAttachments.length > 0 ? `Shared ${uploadedAttachments.length} file(s)` : ''),
          attachments: uploadedAttachments
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newMappedComment: Comment = {
          id: data.id,
          transaction_id: data.transaction_id,
          user_id: data.user_id,
          user_name: currentUserName,
          user_role: currentUserRole,
          text: data.content,
          attachments: data.attachments || [],
          created_at: data.created_at
        };
        setComments(prev => [...prev, newMappedComment]);
        setNewComment('');
        setPendingAttachments([]);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Error posting comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-6 border-t border-gray-100 pt-6">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={18} className="text-secondary" />
        <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Discussion</h4>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="animate-spin text-gray-200" size={24} />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-4">No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className={cn(
                "flex flex-col gap-1 p-3 rounded-xl text-sm",
                comment.user_id === currentUserId 
                  ? "bg-secondary/5 border border-secondary/10 self-end ml-8" 
                  : "bg-gray-50 border border-gray-100 self-start mr-8"
              )}
            >
              <div className="flex justify-between items-center gap-4 mb-1">
                <span className={cn(
                  "font-bold text-[10px] uppercase tracking-tighter",
                  comment.user_role === 'cpa' ? "text-primary" : "text-secondary"
                )}>
                  {comment.user_name} ({comment.user_role.toUpperCase()})
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-primary/80 leading-relaxed">{comment.text}</p>
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {comment.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-white/50 rounded-lg border border-gray-200 hover:bg-white transition-all group"
                    >
                      <FileText size={14} className="text-secondary" />
                      <span className="text-[10px] font-bold truncate max-w-[120px]">{file.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {pendingAttachments.map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-1">
              <FileText size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold truncate max-w-[100px] text-gray-600">{file.name}</span>
              <button 
                type="button"
                onClick={() => removePendingAttachment(i)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all border-2 border-gray-50 hover:border-gray-100"
          disabled={submitting}
        >
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ask a question or leave a note..."
          className="flex-1 p-3 rounded-xl border-2 border-gray-50 focus:border-secondary outline-none transition-all text-sm font-medium"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={(!newComment.trim() && pendingAttachments.length === 0) || submitting}
          className="p-3 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-secondary/20"
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
