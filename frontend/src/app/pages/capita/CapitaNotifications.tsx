import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Card } from '../../components/Card';
import { Bell, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeIcon: Record<string, any> = {
  document_approved: CheckCircle,
  document_rejected: XCircle,
  calendar_published: Calendar,
};

const typeColor: Record<string, string> = {
  document_approved: 'text-green-600 bg-green-100',
  document_rejected: 'text-red-600 bg-red-100',
  calendar_published: 'text-blue-600 bg-blue-100',
};

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
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex min-h-screen bg-[#F1EFE8]">
      <Sidebar role="capita" />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="mb-8">Notificacions</h1>
          <div className="space-y-4">
            {notifications.map((n) => {
              const Icon = typeIcon[n.type] || Bell;
              const color = typeColor[n.type] || 'text-gray-600 bg-gray-100';
              return (
                <Card key={n.id} className={n.is_read ? '' : 'border-l-4 border-[#D85A30]'}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#2C2C2A]">{n.title}</p>
                      <p className="text-[#5F5E5A] text-sm mt-1">{n.message}</p>
                      <p className="text-[12px] text-[#8F8E8A] mt-2">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
