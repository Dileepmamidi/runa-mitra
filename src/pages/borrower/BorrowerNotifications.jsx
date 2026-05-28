import { Card } from "../../components/Card";
import { Bell, Clock } from "lucide-react";

export function BorrowerNotifications() {
  // In the future, this will fetch from a notifications subcollection or be derived from reminders
  const dummyNotifications = [
    { id: 1, text: "మీ తదుపరి చెల్లింపు జనవరి 10కి ఉంది.", date: "Today", type: "reminder" },
    { id: 2, text: "మీ సమయం పెంపు అభ్యర్థన ఆమోదించబడింది.", date: "Yesterday", type: "success" }
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-3xl font-black text-slate-950 mb-6">సూచనలు (Updates)</h2>
      
      <div className="grid gap-3">
        {dummyNotifications.map(notif => (
          <Card key={notif.id} className="flex gap-4 items-start">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notif.type === 'success' ? 'bg-leaf-100 text-leaf-700' : 'bg-blue-100 text-blue-700'}`}>
              <Bell size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900">{notif.text}</p>
              <div className="mt-1 flex items-center text-xs font-semibold text-slate-500">
                <Clock size={12} className="mr-1" /> {notif.date}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
