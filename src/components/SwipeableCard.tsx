'use client';

import React from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Globe, Repeat, Paperclip } from 'lucide-react';
import { Transaction } from '@/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SwipeableCardProps {
  transaction: Transaction;
  onSwipeRight: () => void; // Business
  onSwipeLeft: () => void;  // Personal
  onClick?: () => void;
}

export default function SwipeableCard({ transaction, onSwipeRight, onSwipeLeft, onClick }: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacityBusiness = useTransform(x, [50, 150], [0, 1]);
  const opacityPersonal = useTransform(x, [-150, -50], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipeRight();
    } else if (info.offset.x < -100) {
      onSwipeLeft();
    }
  };

  const isMultiCurrency = transaction.original_currency && transaction.original_currency !== 'USD';

  return (
    <div className="relative w-full max-w-sm h-56 perspective-1000">
      {/* Background Labels */}
      <motion.div 
        style={{ opacity: opacityBusiness }}
        className="absolute inset-0 flex items-center justify-start pl-10 bg-success/20 rounded-2xl border-2 border-success pointer-events-none"
      >
        <span className="text-success font-bold text-xl uppercase">Business</span>
      </motion.div>
      
      <motion.div 
        style={{ opacity: opacityPersonal }}
        className="absolute inset-0 flex items-center justify-end pr-10 bg-error/20 rounded-2xl border-2 border-error pointer-events-none"
      >
        <span className="text-error font-bold text-xl uppercase">Personal</span>
      </motion.div>

      {/* The Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        style={{ x, rotate }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05 }}
        onClick={onClick}
        className="absolute inset-0 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary truncate pr-2">{transaction.vendor}</h3>
            <p className="text-sm text-gray-500">{transaction.date}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              ${transaction.amount.toFixed(2)}
            </div>
            {isMultiCurrency && (
              <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                <Globe size={10} />
                <span>{transaction.original_amount?.toFixed(2)} {transaction.original_currency}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-3 mt-4">
          {isMultiCurrency && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Repeat size={12} className="text-secondary" />
              <span>Rate: 1 {transaction.original_currency} = ${transaction.exchange_rate?.toFixed(4)}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {transaction.is_reimbursable && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-bold rounded-md border border-blue-100">
                  REIMBURSABLE
                </span>
              )}
              {transaction.client_tag && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-500 text-[10px] font-bold rounded-md border border-purple-100">
                  {transaction.client_tag.toUpperCase()}
                </span>
              )}
              {(transaction.has_attachments || (transaction.comments && transaction.comments.some(c => c.attachments && c.attachments.length > 0))) && (
                <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold rounded-md border border-secondary/20 flex items-center gap-1">
                  <Paperclip size={10} />
                  FILE
                </span>
              )}
            </div>
            
            {transaction.category_suggestion && (
              <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                {transaction.category_suggestion}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
