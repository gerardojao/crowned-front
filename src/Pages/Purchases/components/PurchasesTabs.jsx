import { BookOpen, FileText, Truck, WalletCards } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: WalletCards },
  { id: "facturas", label: "Facturas proveedor", icon: FileText },
  { id: "cxp", label: "Cuentas por pagar", icon: WalletCards },
  { id: "libro", label: "Libro de compras", icon: BookOpen },
  { id: "albaranes", label: "Albaranes", icon: Truck },
];

export default function PurchasesTabs({ activeTab, setActiveTab }) {
  return (
    <div className="mt-4 border-b border-slate-200">
      <nav className="flex flex-wrap gap-2 text-sm font-semibold">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-2 transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
