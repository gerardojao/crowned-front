import { useEffect, useState } from "react";
import { Building2, CheckCircle, Plus, Save, Trash2, UserCog, UserPlus, X } from "lucide-react";
import api from "../Components/api";

const BUSINESS_TYPES = [
  { value: "automotive", label: "Automotriz / taller" },
  { value: "technical_services", label: "Servicios tecnicos" },
  { value: "generic_services", label: "Servicios generales" },
  { value: "invoice_only", label: "Facturacion general" },
];

const TERMINOLOGY_PROFILES = [
  { value: "automotive", label: "Automotriz" },
  { value: "equipment_service", label: "Servicios con equipos" },
  { value: "generic_service", label: "Servicios generales" },
];

const OPERATION_TYPES = ["Mecanica", "Chapa y pintura", "Recambio"];

const emptyWorkshop = {
  nombre: "",
  razonSocial: "",
  nif: "",
  direccion: "",
  telefono: "",
  email: "",
  iban: "",
  serieFactura: "A",
  serieFacturaRecambio: "RC",
  serieFacturaRapel: "RP",
  serieFacturaSinIva: "SI",
  logoPath: "",
  maxUsers: 3,
  activo: true,
  businessType: "automotive",
  terminologyProfile: "automotive",
  footerText: "",
  privacyPolicyText: "",
  termsText: "",
  enableWhatsappAlerts: true,
  enableInvoiceExport: true,
  enableProfitAndLoss: true,
  enableDashboardRepairVehicles: true,
  enableDashboardBilling: true,
  enablePreOrders: true,
  enableSpecialInvoices: true,
  enableRapelInvoices: false,
  enableNoVatInvoices: false,
  enableDigitalSignatures: true,
  enableReceptionPhotos: true,
  enableDetailedRepairInvoiceLines: false,
  enableAccountsReceivable: true,
  enableAccountsPayable: false,
  enableStockPayments: false,
  enableLedger: true,
  allowInvoiceClientEdit: false,
  operationTypes: ["Mecanica"],
  ownerEmail: "",
  ownerPassword: "",
  ownerFullName: "",
};

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState([]);
  const [form, setForm] = useState(emptyWorkshop);
  const [selectedId, setSelectedId] = useState("");
  const [userForm, setUserForm] = useState({ email: "", password: "", fullName: "", role: "user" });
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState("");
  const [editUserForm, setEditUserForm] = useState({
    fullName: "",
    workshopRole: "user",
    systemRole: "user",
    isActive: true,
    workshopUserActive: true,
    password: "",
  });
  const [removeModal, setRemoveModal] = useState({ open: false, user: null, loading: false });
  const [legalForm, setLegalForm] = useState({
    nombre: "",
    razonSocial: "",
    nif: "",
    direccion: "",
    telefono: "",
    email: "",
    iban: "",
    serieFactura: "A",
    serieFacturaRecambio: "RC",
    serieFacturaRapel: "RP",
    serieFacturaSinIva: "SI",
    logoPath: "",
    activo: true,
    footerText: "",
    privacyPolicyText: "",
    termsText: "",
    maxUsers: 3,
    businessType: "automotive",
    terminologyProfile: "automotive",
    enableWhatsappAlerts: true,
    enableInvoiceExport: true,
    enableProfitAndLoss: true,
    enableDashboardRepairVehicles: true,
    enableDashboardBilling: true,
    enablePreOrders: true,
    enableSpecialInvoices: true,
    enableRapelInvoices: false,
    enableNoVatInvoices: false,
    enableDigitalSignatures: true,
    enableReceptionPhotos: true,
    enableDetailedRepairInvoiceLines: false,
    enableAccountsReceivable: true,
    enableAccountsPayable: false,
    enableStockPayments: false,
    enableLedger: true,
    allowInvoiceClientEdit: false,
    operationTypes: ["Mecanica"],
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [messageModal, setMessageModal] = useState("");
  const [banks, setBanks] = useState([]);
  const [bankDrafts, setBankDrafts] = useState({});
  const [bankForm, setBankForm] = useState({ nombre: "", iban: "", esPrincipal: false });

  useEffect(() => {
    if (!messageModal) return undefined;

    const timer = setTimeout(() => setMessageModal(""), 2500);
    return () => clearTimeout(timer);
  }, [messageModal]);

  const showSuccessModal = (text) => {
    setMessage(text);
    setMessageModal(text);
  };

  const load = async () => {
    const res = await api.get("/AdminWorkshops");
    setWorkshops(res.data || []);
  };

  const loadUsers = async (workshopId = selectedId) => {
    if (!workshopId) {
      setUsers([]);
      return;
    }
    const res = await api.get(`/AdminWorkshops/${workshopId}/users`);
    setUsers(res.data || []);
  };

  const loadBanks = async (workshopId = selectedId) => {
    if (!workshopId) {
      setBanks([]);
      setBankDrafts({});
      return;
    }
    const res = await api.get(`/WorkshopBankAccounts/admin/${workshopId}`);
    setBankList(Array.isArray(res.data) ? res.data : []);
  };

  const setBankList = (list) => {
    setBanks(list);
    setBankDrafts(
      Object.fromEntries(
        list.map((bank) => {
          const id = bank.id ?? bank.Id;
          return [
            id,
            {
              nombre: bank.nombre ?? bank.Nombre ?? "",
              iban: bank.iban ?? bank.Iban ?? "",
            },
          ];
        }),
      ),
    );
  };

  useEffect(() => {
    load().catch((err) => setError(err?.response?.data?.message || "No se pudieron cargar los negocios."));
  }, []);

  const selectedWorkshop = workshops.find((w) => String(w.id ?? w.Id) === selectedId);

  useEffect(() => {
    if (!selectedWorkshop) {
      setLegalForm({
        nombre: "",
        razonSocial: "",
        nif: "",
        direccion: "",
        telefono: "",
        email: "",
        iban: "",
        serieFactura: "A",
        serieFacturaRecambio: "RC",
        serieFacturaRapel: "RP",
        serieFacturaSinIva: "SI",
        logoPath: "",
        activo: true,
        footerText: "",
        privacyPolicyText: "",
        termsText: "",
        maxUsers: 3,
        businessType: "automotive",
        terminologyProfile: "automotive",
        enableWhatsappAlerts: true,
        enableInvoiceExport: true,
        enableProfitAndLoss: true,
        enableDashboardRepairVehicles: true,
        enableDashboardBilling: true,
        enablePreOrders: true,
        enableSpecialInvoices: true,
        enableRapelInvoices: false,
        enableNoVatInvoices: false,
        enableDigitalSignatures: true,
        enableReceptionPhotos: true,
        enableDetailedRepairInvoiceLines: false,
        enableAccountsReceivable: true,
        enableAccountsPayable: false,
        enableStockPayments: false,
        enableLedger: true,
        allowInvoiceClientEdit: false,
      });
      setUsers([]);
      setBanks([]);
      setBankDrafts({});
      return;
    }

    setLegalForm({
      nombre: selectedWorkshop.nombre ?? selectedWorkshop.Nombre ?? "",
      razonSocial: selectedWorkshop.razonSocial ?? selectedWorkshop.RazonSocial ?? "",
      nif: selectedWorkshop.nif ?? selectedWorkshop.Nif ?? "",
      direccion: selectedWorkshop.direccion ?? selectedWorkshop.Direccion ?? "",
      telefono: selectedWorkshop.telefono ?? selectedWorkshop.Telefono ?? "",
      email: selectedWorkshop.email ?? selectedWorkshop.Email ?? "",
      iban: selectedWorkshop.iban ?? selectedWorkshop.Iban ?? "",
      serieFactura: selectedWorkshop.serieFactura ?? selectedWorkshop.SerieFactura ?? "A",
      serieFacturaRecambio:
        selectedWorkshop.serieFacturaRecambio ??
        selectedWorkshop.SerieFacturaRecambio ??
        "RC",
      serieFacturaRapel:
        selectedWorkshop.serieFacturaRapel ??
        selectedWorkshop.SerieFacturaRapel ??
        "RP",
      serieFacturaSinIva:
        selectedWorkshop.serieFacturaSinIva ??
        selectedWorkshop.SerieFacturaSinIva ??
        "SI",
      logoPath: selectedWorkshop.logoPath ?? selectedWorkshop.LogoPath ?? "",
      activo: selectedWorkshop.activo ?? selectedWorkshop.Activo ?? true,
      footerText: selectedWorkshop.footerText ?? selectedWorkshop.FooterText ?? "",
      privacyPolicyText: selectedWorkshop.privacyPolicyText ?? selectedWorkshop.PrivacyPolicyText ?? "",
      termsText: selectedWorkshop.termsText ?? selectedWorkshop.TermsText ?? "",
      maxUsers: selectedWorkshop.maxUsers ?? selectedWorkshop.MaxUsers ?? 3,
      businessType: selectedWorkshop.businessType ?? selectedWorkshop.BusinessType ?? "automotive",
      terminologyProfile: selectedWorkshop.terminologyProfile ?? selectedWorkshop.TerminologyProfile ?? "automotive",
      enableWhatsappAlerts: selectedWorkshop.enableWhatsappAlerts ?? selectedWorkshop.EnableWhatsappAlerts ?? true,
      enableInvoiceExport: selectedWorkshop.enableInvoiceExport ?? selectedWorkshop.EnableInvoiceExport ?? true,
      enableProfitAndLoss: selectedWorkshop.enableProfitAndLoss ?? selectedWorkshop.EnableProfitAndLoss ?? true,
      enableDashboardRepairVehicles:
        selectedWorkshop.enableDashboardRepairVehicles ??
        selectedWorkshop.EnableDashboardRepairVehicles ??
        true,
      enableDashboardBilling:
        selectedWorkshop.enableDashboardBilling ??
        selectedWorkshop.EnableDashboardBilling ??
        true,
      enablePreOrders:
        selectedWorkshop.enablePreOrders ??
        selectedWorkshop.EnablePreOrders ??
        true,
      enableSpecialInvoices:
        selectedWorkshop.enableSpecialInvoices ??
        selectedWorkshop.EnableSpecialInvoices ??
        true,
      enableRapelInvoices:
        selectedWorkshop.enableRapelInvoices ??
        selectedWorkshop.EnableRapelInvoices ??
        false,
      enableNoVatInvoices:
        selectedWorkshop.enableNoVatInvoices ??
        selectedWorkshop.EnableNoVatInvoices ??
        false,
      enableDigitalSignatures:
        selectedWorkshop.enableDigitalSignatures ??
        selectedWorkshop.EnableDigitalSignatures ??
        true,
      enableReceptionPhotos:
        selectedWorkshop.enableReceptionPhotos ??
        selectedWorkshop.EnableReceptionPhotos ??
        true,
      enableDetailedRepairInvoiceLines:
        selectedWorkshop.enableDetailedRepairInvoiceLines ??
        selectedWorkshop.EnableDetailedRepairInvoiceLines ??
        false,
      enableAccountsReceivable:
        selectedWorkshop.enableAccountsReceivable ??
        selectedWorkshop.EnableAccountsReceivable ??
        true,
      enableAccountsPayable:
        selectedWorkshop.enableAccountsPayable ??
        selectedWorkshop.EnableAccountsPayable ??
        false,
      enableStockPayments:
        selectedWorkshop.enableStockPayments ??
        selectedWorkshop.EnableStockPayments ??
        false,
      enableLedger:
        selectedWorkshop.enableLedger ??
        selectedWorkshop.EnableLedger ??
        true,
      allowInvoiceClientEdit:
        selectedWorkshop.allowInvoiceClientEdit ??
        selectedWorkshop.AllowInvoiceClientEdit ??
        false,
      operationTypes: normalizeOperationTypes(
        selectedWorkshop.operationTypes ?? selectedWorkshop.OperationTypes,
      ),
    });
    setForm({
      nombre: selectedWorkshop.nombre ?? selectedWorkshop.Nombre ?? "",
      razonSocial: selectedWorkshop.razonSocial ?? selectedWorkshop.RazonSocial ?? "",
      nif: selectedWorkshop.nif ?? selectedWorkshop.Nif ?? "",
      direccion: selectedWorkshop.direccion ?? selectedWorkshop.Direccion ?? "",
      telefono: selectedWorkshop.telefono ?? selectedWorkshop.Telefono ?? "",
      email: selectedWorkshop.email ?? selectedWorkshop.Email ?? "",
      iban: selectedWorkshop.iban ?? selectedWorkshop.Iban ?? "",
      serieFactura: selectedWorkshop.serieFactura ?? selectedWorkshop.SerieFactura ?? "A",
      serieFacturaRecambio:
        selectedWorkshop.serieFacturaRecambio ??
        selectedWorkshop.SerieFacturaRecambio ??
        "RC",
      serieFacturaRapel:
        selectedWorkshop.serieFacturaRapel ??
        selectedWorkshop.SerieFacturaRapel ??
        "RP",
      serieFacturaSinIva:
        selectedWorkshop.serieFacturaSinIva ??
        selectedWorkshop.SerieFacturaSinIva ??
        "SI",
      logoPath: selectedWorkshop.logoPath ?? selectedWorkshop.LogoPath ?? "",
      maxUsers: selectedWorkshop.maxUsers ?? selectedWorkshop.MaxUsers ?? 3,
      activo: selectedWorkshop.activo ?? selectedWorkshop.Activo ?? true,
      businessType: selectedWorkshop.businessType ?? selectedWorkshop.BusinessType ?? "automotive",
      terminologyProfile: selectedWorkshop.terminologyProfile ?? selectedWorkshop.TerminologyProfile ?? "automotive",
      footerText: selectedWorkshop.footerText ?? selectedWorkshop.FooterText ?? "",
      privacyPolicyText: selectedWorkshop.privacyPolicyText ?? selectedWorkshop.PrivacyPolicyText ?? "",
      termsText: selectedWorkshop.termsText ?? selectedWorkshop.TermsText ?? "",
      enableWhatsappAlerts: selectedWorkshop.enableWhatsappAlerts ?? selectedWorkshop.EnableWhatsappAlerts ?? true,
      enableInvoiceExport: selectedWorkshop.enableInvoiceExport ?? selectedWorkshop.EnableInvoiceExport ?? true,
      enableProfitAndLoss: selectedWorkshop.enableProfitAndLoss ?? selectedWorkshop.EnableProfitAndLoss ?? true,
      enableDashboardRepairVehicles:
        selectedWorkshop.enableDashboardRepairVehicles ??
        selectedWorkshop.EnableDashboardRepairVehicles ??
        true,
      enableDashboardBilling:
        selectedWorkshop.enableDashboardBilling ??
        selectedWorkshop.EnableDashboardBilling ??
        true,
      enablePreOrders:
        selectedWorkshop.enablePreOrders ??
        selectedWorkshop.EnablePreOrders ??
        true,
      enableSpecialInvoices:
        selectedWorkshop.enableSpecialInvoices ??
        selectedWorkshop.EnableSpecialInvoices ??
        true,
      enableRapelInvoices:
        selectedWorkshop.enableRapelInvoices ??
        selectedWorkshop.EnableRapelInvoices ??
        false,
      enableNoVatInvoices:
        selectedWorkshop.enableNoVatInvoices ??
        selectedWorkshop.EnableNoVatInvoices ??
        false,
      enableDigitalSignatures:
        selectedWorkshop.enableDigitalSignatures ??
        selectedWorkshop.EnableDigitalSignatures ??
        true,
      enableReceptionPhotos:
        selectedWorkshop.enableReceptionPhotos ??
        selectedWorkshop.EnableReceptionPhotos ??
        true,
      enableDetailedRepairInvoiceLines:
        selectedWorkshop.enableDetailedRepairInvoiceLines ??
        selectedWorkshop.EnableDetailedRepairInvoiceLines ??
        false,
      enableAccountsReceivable:
        selectedWorkshop.enableAccountsReceivable ??
        selectedWorkshop.EnableAccountsReceivable ??
        true,
      enableAccountsPayable:
        selectedWorkshop.enableAccountsPayable ??
        selectedWorkshop.EnableAccountsPayable ??
        false,
      enableStockPayments:
        selectedWorkshop.enableStockPayments ??
        selectedWorkshop.EnableStockPayments ??
        false,
      enableLedger:
        selectedWorkshop.enableLedger ??
        selectedWorkshop.EnableLedger ??
        true,
      allowInvoiceClientEdit:
        selectedWorkshop.allowInvoiceClientEdit ??
        selectedWorkshop.AllowInvoiceClientEdit ??
        false,
      operationTypes: normalizeOperationTypes(
        selectedWorkshop.operationTypes ?? selectedWorkshop.OperationTypes,
      ),
      ownerEmail: "",
      ownerPassword: "",
      ownerFullName: "",
    });
    setEditingUserId("");
    loadUsers(selectedId).catch((err) => setError(err?.response?.data?.message || "No se pudieron cargar los usuarios."));
    loadBanks(selectedId).catch((err) => setError(err?.response?.data?.message || "No se pudieron cargar los bancos."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, workshops]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const saveWorkshop = async (ev) => {
    ev.preventDefault();
    setMessage("");
    setError("");

    try {
      if (selectedId) {
        await api.put(`/AdminWorkshops/${selectedId}/legal`, {
          ...form,
          maxUsers: Number(form.maxUsers || 3),
        });
        showSuccessModal("Taller actualizado correctamente.");
      } else {
        await api.post("/AdminWorkshops", {
          ...form,
          maxUsers: Number(form.maxUsers || 3),
        });
        setForm(emptyWorkshop);
        showSuccessModal("Taller creado correctamente.");
      }
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo guardar el negocio.");
    }
  };

  const startNewWorkshop = () => {
    setSelectedId("");
    setForm(emptyWorkshop);
    setUsers([]);
    setBanks([]);
    setBankDrafts({});
    setEditingUserId("");
    setMessage("");
    setError("");
  };

  const addBank = async (ev) => {
    ev.preventDefault();
    if (!selectedId) return;
    setMessage("");
    setError("");

    try {
      const res = await api.post(`/WorkshopBankAccounts/admin/${selectedId}`, bankForm);
      setBankList(Array.isArray(res.data) ? res.data : []);
      setBankForm({ nombre: "", iban: "", esPrincipal: false });
      setMessage("Banco agregado correctamente.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo agregar el banco.");
    }
  };

  const updateBank = async (bank, patch) => {
    if (!selectedId) return;
    setMessage("");
    setError("");
    const id = bank.id ?? bank.Id;
    const payload = {
      nombre: bank.nombre ?? bank.Nombre,
      iban: bank.iban ?? bank.Iban,
      esPrincipal: bank.esPrincipal ?? bank.EsPrincipal,
      activo: bank.activo ?? bank.Activo,
      ...patch,
    };

    try {
      const res = await api.put(`/WorkshopBankAccounts/admin/${selectedId}/${id}`, payload);
      setBankList(Array.isArray(res.data) ? res.data : []);
      setMessage("Banco actualizado correctamente.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo actualizar el banco.");
    }
  };

  const deactivateBank = async (bank) => {
    if (!selectedId) return;
    const id = bank.id ?? bank.Id;
    setMessage("");
    setError("");

    try {
      const res = await api.delete(`/WorkshopBankAccounts/admin/${selectedId}/${id}`);
      setBankList(Array.isArray(res.data) ? res.data : []);
      setMessage("Banco desactivado correctamente.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo desactivar el banco.");
    }
  };

  const addUser = async (ev) => {
    ev.preventDefault();
    if (!selectedId) return;
    setMessage("");
    setError("");

    try {
      await api.post(`/AdminWorkshops/${selectedId}/users`, userForm);
      setUserForm({ email: "", password: "", fullName: "", role: "user" });
      setMessage("Usuario agregado al negocio.");
      await load();
      await loadUsers(selectedId);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo agregar el usuario.");
    }
  };

  const startEditUser = (u) => {
    setEditingUserId(String(u.userId ?? u.UserId));
    setEditUserForm({
      fullName: u.fullName ?? u.FullName ?? "",
      workshopRole: u.workshopRole ?? u.WorkshopRole ?? "user",
      systemRole: u.systemRole ?? u.SystemRole ?? "user",
      isActive: u.userActive ?? u.UserActive ?? true,
      workshopUserActive: u.workshopUserActive ?? u.WorkshopUserActive ?? true,
      password: "",
    });
  };

  const saveUser = async (ev) => {
    ev.preventDefault();
    if (!selectedId || !editingUserId) return;
    setMessage("");
    setError("");

    try {
      await api.put(`/AdminWorkshops/${selectedId}/users/${editingUserId}`, {
        ...editUserForm,
        password: editUserForm.password || null,
      });
      setMessage("Usuario actualizado correctamente.");
      setEditingUserId("");
      await load();
      await loadUsers(selectedId);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo actualizar el usuario.");
    }
  };

  const openRemoveModal = (u) => {
    setRemoveModal({ open: true, user: u, loading: false });
  };

  const closeRemoveModal = () => {
    if (removeModal.loading) return;
    setRemoveModal({ open: false, user: null, loading: false });
  };

  const removeUser = async () => {
    if (!selectedId) return;
    const u = removeModal.user;
    if (!u) return;

    const userId = u.userId ?? u.UserId;

    setMessage("");
    setError("");
    try {
      setRemoveModal((prev) => ({ ...prev, loading: true }));
      await api.delete(`/AdminWorkshops/${selectedId}/users/${userId}`);
      setMessage("Usuario quitado del negocio.");
      setRemoveModal({ open: false, user: null, loading: false });
      await load();
      await loadUsers(selectedId);
    } catch (err) {
      setRemoveModal((prev) => ({ ...prev, loading: false }));
      setError(err?.response?.data?.message || err?.message || "No se pudo quitar el usuario.");
    }
  };

  const saveLegal = async (ev) => {
    ev.preventDefault();
    if (!selectedId) return;
    setMessage("");
    setError("");

    try {
      await api.put(`/AdminWorkshops/${selectedId}/legal`, {
        ...legalForm,
        maxUsers: Number(legalForm.maxUsers || 3),
      });
      showSuccessModal("Taller actualizado correctamente.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo actualizar el negocio.");
    }
  };

  return (
    <div className="space-y-6">
      {messageModal && (
        <div
          className="fixed left-1/2 top-6 z-[120] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
          role="dialog"
          aria-live="polite"
        >
          <div className="rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-emerald-200">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle size={21} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">Actualizacion guardada</h3>
                <p className="mt-1 text-sm text-slate-600">{messageModal}</p>
              </div>
              <button
                type="button"
                onClick={() => setMessageModal("")}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar aviso"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Building2 size={23} />
          </span>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Administrar negocios</h2>
            <p className="text-sm text-slate-500">
              Solo superadmin puede crear negocios, asignar usuarios y ajustar el limite por negocio.
            </p>
          </div>
        </div>

        {error && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <form onSubmit={saveWorkshop} className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              {selectedId ? <Save size={19} /> : <Plus size={19} />}
              {selectedId ? "Editar negocio" : "Nuevo negocio"}
            </h3>
            {selectedId && (
              <button
                type="button"
                onClick={startNewWorkshop}
                className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Crear nuevo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Nombre" value={form.nombre} onChange={(v) => setField("nombre", v)} required />
            <Input label="Razon social" value={form.razonSocial} onChange={(v) => setField("razonSocial", v)} required />
            <Input label="NIF/CIF" value={form.nif} onChange={(v) => setField("nif", v)} required />
            <Input label="Serie factura" value={form.serieFactura} onChange={(v) => setField("serieFactura", v)} />
            <Input label="Serie factura recambio" value={form.serieFacturaRecambio} onChange={(v) => setField("serieFacturaRecambio", v)} />
            <Input label="Serie factura Rapel" value={form.serieFacturaRapel} onChange={(v) => setField("serieFacturaRapel", v)} />
            <Input label="Serie factura sin IVA" value={form.serieFacturaSinIva} onChange={(v) => setField("serieFacturaSinIva", v)} />
            <Select label="Tipo de negocio" value={form.businessType} onChange={(v) => setField("businessType", v)} options={BUSINESS_TYPES} />
            <Select label="Perfil de textos" value={form.terminologyProfile} onChange={(v) => setField("terminologyProfile", v)} options={TERMINOLOGY_PROFILES} />
            <Input label="Telefono" value={form.telefono} onChange={(v) => setField("telefono", v)} />
            <Input label="Email" value={form.email} onChange={(v) => setField("email", v)} />
            <Input label="IBAN" value={form.iban} onChange={(v) => setField("iban", v)} />
            <Input label="Logo path" value={form.logoPath} onChange={(v) => setField("logoPath", v)} placeholder="/uploads/workshops/logo.png" />
            <Input label="Max usuarios" type="number" min="1" value={form.maxUsers} onChange={(v) => setField("maxUsers", v)} />
            <div className="md:col-span-2">
              <Input label="Direccion" value={form.direccion} onChange={(v) => setField("direccion", v)} required />
            </div>
            {selectedId && (
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.activo)}
                  onChange={(e) => setField("activo", e.target.checked)}
                />
                Negocio activo
              </label>
            )}
            {!selectedId && (
              <>
                <Input label="Email owner" value={form.ownerEmail} onChange={(v) => setField("ownerEmail", v)} />
                <Input label="Password owner nuevo" type="password" value={form.ownerPassword} onChange={(v) => setField("ownerPassword", v)} />
                <div className="md:col-span-2">
                  <Input label="Nombre owner" value={form.ownerFullName} onChange={(v) => setField("ownerFullName", v)} />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <FeatureSwitches
                values={form}
                onChange={(name, value) => setField(name, value)}
              />
            </div>
            <div className="md:col-span-2">
              <OperationTypeSwitches
                values={form.operationTypes}
                onChange={(values) => setField("operationTypes", values)}
              />
            </div>
            <Input label="Footer" value={form.footerText} onChange={(v) => setField("footerText", v)} />
            <Textarea label="Politicas" value={form.privacyPolicyText} onChange={(v) => setField("privacyPolicyText", v)} />
            <Textarea label="Terminos" value={form.termsText} onChange={(v) => setField("termsText", v)} />
          </div>

          <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            {selectedId ? <Save size={17} /> : <Plus size={17} />}
            {selectedId ? "Guardar cambios" : "Crear negocio"}
          </button>
        </form>

        <div className="space-y-6">
      {messageModal && (
        <div
          className="fixed left-1/2 top-6 z-[120] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
          role="dialog"
          aria-live="polite"
        >
          <div className="rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-emerald-200">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle size={21} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">Actualizacion guardada</h3>
                <p className="mt-1 text-sm text-slate-600">{messageModal}</p>
              </div>
              <button
                type="button"
                onClick={() => setMessageModal("")}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar aviso"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
          <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Negocios registrados</h3>
            <div className="space-y-2">
              {workshops.map((w) => (
                <button
                  key={w.id ?? w.Id}
                  type="button"
                  onClick={() => setSelectedId(String(w.id ?? w.Id))}
                  className={`w-full rounded-2xl border p-3 text-left text-sm ${
                    String(w.id ?? w.Id) === selectedId ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="font-bold text-slate-900">{w.nombre ?? w.Nombre}</div>
                  <div className="text-slate-500">
                    {w.nif ?? w.Nif} · {w.activeUsers ?? w.ActiveUsers}/{w.maxUsers ?? w.MaxUsers ?? 3} usuarios
                  </div>
                  {!(w.activo ?? w.Activo ?? true) && (
                    <div className="mt-1 text-xs font-bold text-rose-600">Negocio desactivado</div>
                  )}
                  <div className="text-xs text-slate-400">
                    {businessTypeLabel(w.businessType ?? w.BusinessType)} - {terminologyProfileLabel(w.terminologyProfile ?? w.TerminologyProfile)}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Bancos del negocio</h3>

            {!selectedId && (
              <p className="text-sm text-slate-500">Selecciona un negocio para gestionar sus bancos.</p>
            )}

            {selectedId && (
              <>
                <form onSubmit={addBank} className="grid grid-cols-1 gap-3">
                  <Input
                    label="Nombre del banco"
                    value={bankForm.nombre}
                    onChange={(v) => setBankForm((p) => ({ ...p, nombre: v }))}
                    placeholder="Cuenta principal"
                  />
                  <Input
                    label="IBAN"
                    value={bankForm.iban}
                    onChange={(v) => setBankForm((p) => ({ ...p, iban: v }))}
                    required
                  />
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={bankForm.esPrincipal}
                      onChange={(e) => setBankForm((p) => ({ ...p, esPrincipal: e.target.checked }))}
                    />
                    Principal
                  </label>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                    <Plus size={17} />
                    Agregar banco
                  </button>
                </form>

                <div className="mt-4 space-y-2">
                  {banks.length === 0 && (
                    <p className="text-sm text-slate-500">No hay bancos registrados.</p>
                  )}
                  {banks.map((bank) => {
                    const id = bank.id ?? bank.Id;
                    const name = bank.nombre ?? bank.Nombre ?? "Cuenta bancaria";
                    const iban = bank.iban ?? bank.Iban ?? "";
                    const active = bank.activo ?? bank.Activo ?? true;
                    const main = bank.esPrincipal ?? bank.EsPrincipal ?? false;
                    const draft = bankDrafts[id] || { nombre: name, iban };
                    return (
                      <div key={id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            label="Nombre"
                            value={draft.nombre}
                            onChange={(v) =>
                              setBankDrafts((prev) => ({
                                ...prev,
                                [id]: { ...(prev[id] || draft), nombre: v },
                              }))
                            }
                          />
                          <Input
                            label="IBAN"
                            value={draft.iban}
                            onChange={(v) =>
                              setBankDrafts((prev) => ({
                                ...prev,
                                [id]: { ...(prev[id] || draft), iban: v },
                              }))
                            }
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {active ? "Activo" : "Inactivo"}
                          </span>
                          {main && (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">
                              Principal
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateBank(bank, {
                                nombre: draft.nombre,
                                iban: draft.iban,
                                esPrincipal: main,
                                activo: active,
                              })
                            }
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                          >
                            Guardar
                          </button>
                          {active && !main && (
                            <button
                              type="button"
                              onClick={() => updateBank(bank, { esPrincipal: true, activo: true })}
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                            >
                              Hacer principal
                            </button>
                          )}
                          {active && (
                            <button
                              type="button"
                              onClick={() => deactivateBank(bank)}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                            >
                              Desactivar
                            </button>
                          )}
                          {!active && (
                            <button
                              type="button"
                              onClick={() => updateBank(bank, { activo: true })}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <form onSubmit={addUser} className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <UserPlus size={19} />
              Agregar usuario
            </h3>
            <Input label="Email" value={userForm.email} onChange={(v) => setUserForm((p) => ({ ...p, email: v }))} required />
            <Input label="Nombre" value={userForm.fullName} onChange={(v) => setUserForm((p) => ({ ...p, fullName: v }))} />
            <Input label="Password si es nuevo" type="password" value={userForm.password} onChange={(v) => setUserForm((p) => ({ ...p, password: v }))} />
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Rol negocio
              <select
                value={userForm.role}
                onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="owner">owner</option>
                <option value="manager">manager</option>
                <option value="mechanic">mechanic</option>
                <option value="viewer">viewer</option>
                <option value="user">user</option>
              </select>
            </label>
            <button disabled={!selectedId} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              <UserPlus size={17} />
              Agregar
            </button>
          </form>

          <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
              <UserCog size={19} />
              Usuarios del negocio
            </h3>

            {!selectedId && (
              <p className="text-sm text-slate-500">Selecciona un negocio para ver sus usuarios.</p>
            )}

            {selectedId && users.length === 0 && (
              <p className="text-sm text-slate-500">Este negocio no tiene usuarios asignados.</p>
            )}

            <div className="space-y-2">
              {users.map((u) => {
                const userId = u.userId ?? u.UserId;
                const email = u.email ?? u.Email;
                const fullName = u.fullName ?? u.FullName ?? "";
                const workshopRole = u.workshopRole ?? u.WorkshopRole;
                const systemRole = u.systemRole ?? u.SystemRole;
                const userActive = u.userActive ?? u.UserActive;
                const workshopUserActive = u.workshopUserActive ?? u.WorkshopUserActive;

                return (
                  <div key={userId} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">{email}</div>
                        <div className="text-slate-500">{fullName || "Sin nombre"}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Negocio: {workshopRole}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Sistema: {systemRole}</span>
                          <span className={`rounded-full px-2 py-0.5 ${workshopUserActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {workshopUserActive ? "Activo en negocio" : "Quitado del negocio"}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 ${userActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {userActive ? "Usuario activo" : "Usuario inactivo"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEditUser(u)}
                          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
                        >
                          Editar
                        </button>
                        {workshopUserActive && (
                          <button
                            type="button"
                            onClick={() => openRemoveModal(u)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                          >
                            <Trash2 size={14} />
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      {editingUserId && (
        <form onSubmit={saveUser} className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <UserCog size={19} />
            Actualizar usuario
          </h3>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              label="Nombre"
              value={editUserForm.fullName}
              onChange={(v) => setEditUserForm((p) => ({ ...p, fullName: v }))}
            />
            <label className="block text-sm font-medium text-slate-700">
              Rol negocio
              <select
                value={editUserForm.workshopRole}
                onChange={(e) => setEditUserForm((p) => ({ ...p, workshopRole: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="owner">owner</option>
                <option value="manager">manager</option>
                <option value="mechanic">mechanic</option>
                <option value="viewer">viewer</option>
                <option value="user">user</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Rol sistema
              <select
                value={editUserForm.systemRole}
                onChange={(e) => setEditUserForm((p) => ({ ...p, systemRole: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </label>
            <Input
              label="Nueva password opcional"
              type="password"
              value={editUserForm.password}
              onChange={(v) => setEditUserForm((p) => ({ ...p, password: v }))}
            />
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={editUserForm.isActive}
                onChange={(e) => setEditUserForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Usuario activo
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={editUserForm.workshopUserActive}
                onChange={(e) => setEditUserForm((p) => ({ ...p, workshopUserActive: e.target.checked }))}
              />
              Activo en este negocio
            </label>
          </div>

          <div className="mt-4 flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
              <Save size={17} />
              Guardar usuario
            </button>
            <button
              type="button"
              onClick={() => setEditingUserId("")}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {removeModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-user-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h3 id="remove-user-title" className="text-lg font-semibold text-slate-900">
              Quitar usuario del negocio
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              ¿Seguro que deseas quitar a{" "}
              <span className="font-semibold text-slate-900">
                {removeModal.user?.email ?? removeModal.user?.Email ?? "este usuario"}
              </span>{" "}
              de este negocio?
            </p>

            <p className="mt-2 text-xs text-slate-500">
              La cuenta no se borra. Solo se desactiva su acceso a este negocio y se conserva el historial.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={removeModal.loading}
                onClick={closeRemoveModal}
                className="rounded-xl bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={removeModal.loading}
                onClick={removeUser}
                className="rounded-xl bg-rose-600 px-4 py-2 text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                {removeModal.loading ? "Quitando..." : "Quitar usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false, placeholder = "", min }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <span className="relative mt-1 block">
        <input
          type={isPassword && showPassword ? "text" : type}
          required={required}
          placeholder={placeholder}
          min={min}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-slate-300 px-3 py-2 text-sm ${isPassword ? "pr-10" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1 text-base text-slate-500 hover:text-slate-700"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            👁️
          </button>
        )}
      </span>
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
      {label}
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function FeatureSwitches({ values, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-bold text-slate-800">Modulos comerciales</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <Switch
            label="Alertas WhatsApp"
            description="Abre WhatsApp al atender alertas de cliente."
            checked={values.enableWhatsappAlerts}
            onChange={(checked) => onChange("enableWhatsappAlerts", checked)}
          />
          <Switch
            label="Exportacion de facturas"
            description="Permite descargar facturas por periodo."
            checked={values.enableInvoiceExport}
            onChange={(checked) => onChange("enableInvoiceExport", checked)}
          />
          <Switch
            label="Estado de resultados"
            description="Permite generar el reporte financiero."
            checked={values.enableProfitAndLoss}
            onChange={(checked) => onChange("enableProfitAndLoss", checked)}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-slate-800">Modulos del dashboard</p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Switch
          label="Vehiculos por estado"
          description="Muestra el contador de órdenes en estado Reparando o Entregado."
          checked={values.enableDashboardRepairVehicles}
          onChange={(checked) =>
            onChange("enableDashboardRepairVehicles", checked)
          }
        />
        <Switch
          label="Facturacion"
          description="Muestra lo facturado hoy y en el mes en el dashboard."
          checked={values.enableDashboardBilling}
          onChange={(checked) => onChange("enableDashboardBilling", checked)}
        />
        <Switch
          label="Pre-órdenes"
          description="Habilita la recepcion previa y conversion a orden."
          checked={values.enablePreOrders}
          onChange={(checked) => onChange("enablePreOrders", checked)}
        />
        <Switch
          label="Facturas especiales"
          description="Habilita facturas de recambio y futuras ventas especiales."
          checked={values.enableSpecialInvoices}
          onChange={(checked) => onChange("enableSpecialInvoices", checked)}
        />
        <Switch
          label="Facturas Rapel"
          description="Permite emitir facturas Rapel con importes negativos."
          checked={values.enableRapelInvoices}
          onChange={(checked) => onChange("enableRapelInvoices", checked)}
        />
        <Switch
          label="Facturas sin IVA"
          description="Permite emitir facturas especiales con tasa de IVA 0%."
          checked={values.enableNoVatInvoices}
          onChange={(checked) => onChange("enableNoVatInvoices", checked)}
        />
        <Switch
          label="Fotos de recepcion"
          description="Permite guardar hasta 5 fotos internas por pre-orden."
          checked={values.enableReceptionPhotos}
          onChange={(checked) => onChange("enableReceptionPhotos", checked)}
        />
        <Switch
          label="Firmas digitales"
          description="Permite capturar firmas en presupuestos, pre-órdenes y órdenes de trabajo."
          checked={values.enableDigitalSignatures}
          onChange={(checked) => onChange("enableDigitalSignatures", checked)}
        />
        <Switch
          label="Líneas técnicas"
          description="Activa precio, tiempo, descuento e IVA por línea de reparación."
          checked={values.enableDetailedRepairInvoiceLines}
          onChange={(checked) => onChange("enableDetailedRepairInvoiceLines", checked)}
        />
        <Switch
          label="Cuentas por cobrar"
          description="Muestra el módulo de importes pendientes de cobro."
          checked={values.enableAccountsReceivable}
          onChange={(checked) => onChange("enableAccountsReceivable", checked)}
        />
        <Switch
          label="Stock / Inventario"
          description="Muestra el módulo de Stock con Inventario y Facturados. Si está apagado, Stock queda en la vista reducida actual."
          checked={values.enableAccountsPayable}
          onChange={(checked) => onChange("enableAccountsPayable", checked)}
        />
        <Switch
          label="Modulo Compras"
          description="Muestra Compras, facturas recibidas, cuentas por pagar, libro de compras y albaranes."
          checked={values.enableStockPayments}
          onChange={(checked) => onChange("enableStockPayments", checked)}
        />
        <Switch
          label="Mayor"
          description="Permite registrar movimientos de Cliente, Proveedor y Banco."
          checked={values.enableLedger}
          onChange={(checked) => onChange("enableLedger", checked)}
        />
        <Switch
          label="Editar cliente en factura"
          description="Permite modificar datos del cliente antes de imprimir una factura."
          checked={values.allowInvoiceClientEdit}
          onChange={(checked) => onChange("allowInvoiceClientEdit", checked)}
        />
      </div>
      </div>
    </div>
  );
}

function OperationTypeSwitches({ values, onChange }) {
  const selected = normalizeOperationTypes(values);
  const toggle = (type, checked) => {
    if (type === "Mecanica") return;
    const next = checked
      ? [...selected, type]
      : selected.filter((item) => item !== type);
    onChange(normalizeOperationTypes(next));
  };

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-800">Tipos de operación</p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {OPERATION_TYPES.map((type) => (
          <Switch
            key={type}
            label={type}
            description={
              type === "Recambio"
                ? "Usado por las facturas de recambio."
                : "Disponible en pre-órdenes, órdenes y presupuestos."
            }
            checked={selected.includes(type)}
            onChange={(checked) => toggle(type, checked)}
          />
        ))}
      </div>
    </div>
  );
}

function Switch({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm transition hover:bg-slate-50">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block font-bold text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs leading-4 text-slate-500">{description}</span>
      </span>
    </label>
  );
}

function businessTypeLabel(value) {
  return BUSINESS_TYPES.find((option) => option.value === value)?.label ?? "Automotriz / taller";
}

function terminologyProfileLabel(value) {
  return TERMINOLOGY_PROFILES.find((option) => option.value === value)?.label ?? "Automotriz";
}

function normalizeOperationTypes(values) {
  const source = Array.isArray(values) ? values : ["Mecanica"];
  const selected = OPERATION_TYPES.filter((type) => source.includes(type));
  if (!selected.includes("Mecanica")) selected.unshift("Mecanica");
  return selected;
}







