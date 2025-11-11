'use client';

import { useEffect, useState } from 'react';

interface XPNotificationProps {
  xpGained: number;
  newRank?: string;
  leveledUp?: boolean;
  onClose: () => void;
}

export default function XPNotification({ xpGained, newRank, leveledUp, onClose }: XPNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`rounded-xl shadow-2xl p-6 ${leveledUp ? 'bg-linear-to-r from-yellow-400 to-orange-500' : 'bg-linear-to-r from-indigo-500 to-purple-600'} text-white`}>
        <div className="text-center">
          {leveledUp && <div className="text-4xl mb-2">🎉</div>}
          <div className="text-2xl font-black mb-2">
            +{xpGained} XP
          </div>
          {leveledUp && newRank && (
            <div className="text-lg font-bold">
              ランクアップ！{newRank}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}