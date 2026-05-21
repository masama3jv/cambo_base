import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Bell } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: string;
  read: boolean;
}

export default function CapitaNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Error:', err);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#5F5E5A]">Carregant...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <Card className="p-6 text-center">
              <p className="text-[#A32D2D]">Error: {error}</p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#F1EFE8]">
        <Sidebar role="capita" />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="mb-8">Notificacions</h1>
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-[#FAECE7] rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell size={32} className="text-[#D85A30]" />
              </div>
              <h3 className="mb-2">No tens notificacions</h3>
              <p className="text-[#5F5E5A]">
                Les notificacions apareixeran aquí quan hi hagi novetats sobre la teva inscripció o els teus partits
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-8">Notificacions</h1>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={notification.read ? '' : 'border-l-4 border-[#D85A30]'}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[#2C2C2A] mb-1">{notification.message}</p>
                    <p className="text-[13px] text-[#5F5E5A]">{notification.date}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
