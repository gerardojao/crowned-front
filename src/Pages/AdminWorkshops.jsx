import { useEffect, useState } from "react";
import { Building2, Plus, Save, Trash2, UserCog, UserPlus } from "lucide-react";
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

const emptyWorkshop = {
  nombre: "",
  razonSocial: "",
  nif: "",
  direccion: "",
  telefono: "",
  email: "",
  iban: "",
  serieFactura: "A",
  logoPath: "",
  businessType: "automotive",
  terminologyProfile: "automotive",
  footerText: "",
  privacyPolicyText: "",
  termsText: "",
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
    footerText: "",
    privacyPolicyText: "",
    termsText: "",
    maxUsers: 3,
    businessType: "automotive",
    terminologyProfile: "automotive",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
    load().catch((err) => setError(err?.response?.data?.message || "No se pudieron cargar los negocios."));
  }, []);

  const selectedWorkshop = workshops.find((w) => String(w.id ?? w.Id) === selectedId);

  useEffect(() => {
    if (!selectedWorkshop) {
      setLegalForm({
        footerText: "",
        privacyPolicyText: "",
        termsText: "",
        maxUsers: 3,
        businessType: "automotive",
        terminologyProfile: "automotive",
      });
      setUsers([]);
      return;
    }

    setLegalForm({
      footerText: selectedWorkshop.footerText ?? selectedWorkshop.FooterText ?? "",
      privacyPolicyText: selectedWorkshop.privacyPolicyText ?? selectedWorkshop.PrivacyPolicyText ?? "",
      termsText: selectedWorkshop.termsText ?? selectedWorkshop.TermsText ?? "",
      maxUsers: selectedWorkshop.maxUsers ?? selectedWorkshop.MaxUsers ?? 3,
      businessType: selectedWorkshop.businessType ?? selectedWorkshop.BusinessType ?? "automotive",
      terminologyProfile: selectedWorkshop.terminologyProfile ?? selectedWorkshop.TerminologyProfile ?? "automotive",
    });
    setEditingUserId("");
    loadUsers(selectedId).catch((err) => setError(err?.response?.data?.message || "No se pudieron cargar los usuarios."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, workshops]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const createWorkshop = async (ev) => {
    ev.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/AdminWorkshops", { ...form, maxUsers: 3 });
      setForm(emptyWorkshop);
      setMessage("Negocio creado correctamente.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo crear el negocio.");
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
      setMessage("Configuracion del negocio actualizada.");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No se pudo actualizar el negocio.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Building2 size={23} />
          </span>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Administrar negocios</h2>
            <p className="text-sm text-slate-500">
              Solo superadmin puede crear negocios y asignar usuarios. Limite actual: 3 usuarios por negocio.
            </p>
          </div>
        </div>

        {message && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200">{message}</div>}
        {error && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <form onSubmit={createWorkshop} className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Plus size={19} />
            Nuevo negocio
          </h3>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Nombre" value={form.nombre} onChange={(v) => setField("nombre", v)} required />
            <Input label="Razon social" value={form.razonSocial} onChange={(v) => setField("razonSocial", v)} required />
            <Input label="NIF/CIF" value={form.nif} onChange={(v) => setField("nif", v)} required />
            <Input label="Serie factura" value={form.serieFactura} onChange={(v) => setField("serieFactura", v)} />
            <Select label="Tipo de negocio" value={form.businessType} onChange={(v) => setField("businessType", v)} options={BUSINESS_TYPES} />
            <Select label="Perfil de textos" value={form.terminologyProfile} onChange={(v) => setField("terminologyProfile", v)} options={TERMINOLOGY_PROFILES} />
            <Input label="Telefono" value={form.telefono} onChange={(v) => setField("telefono", v)} />
            <Input label="Email" value={form.email} onChange={(v) => setField("email", v)} />
            <Input label="IBAN" value={form.iban} onChange={(v) => setField("iban", v)} />
            <Input label="Logo path" value={form.logoPath} onChange={(v) => setField("logoPath", v)} placeholder="/uploads/workshops/logo.png" />
            <div className="md:col-span-2">
              <Input label="Direccion" value={form.direccion} onChange={(v) => setField("direccion", v)} required />
            </div>
            <Input label="Email owner" value={form.ownerEmail} onChange={(v) => setField("ownerEmail", v)} />
            <Input label="Password owner nuevo" type="password" value={form.ownerPassword} onChange={(v) => setField("ownerPassword", v)} />
            <div className="md:col-span-2">
              <Input label="Nombre owner" value={form.ownerFullName} onChange={(v) => setField("ownerFullName", v)} />
            </div>
          </div>

          <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
            <Plus size={17} />
            Crear negocio
          </button>
        </form>

        <div className="space-y-6">
          <section className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Negocios activos</h3>
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
                  <div className="text-xs text-slate-400">
                    {businessTypeLabel(w.businessType ?? w.BusinessType)} - {terminologyProfileLabel(w.terminologyProfile ?? w.TerminologyProfile)}
                  </div>
                </button>
              ))}
            </div>
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

      <form onSubmit={saveLegal} className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Save size={19} />
          Tipo, footer, politicas y terminos
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Max usuarios" type="number" value={legalForm.maxUsers} onChange={(v) => setLegalForm((p) => ({ ...p, maxUsers: v }))} />
          <Select label="Tipo de negocio" value={legalForm.businessType} onChange={(v) => setLegalForm((p) => ({ ...p, businessType: v }))} options={BUSINESS_TYPES} />
          <Select label="Perfil de textos" value={legalForm.terminologyProfile} onChange={(v) => setLegalForm((p) => ({ ...p, terminologyProfile: v }))} options={TERMINOLOGY_PROFILES} />
          <Input label="Footer" value={legalForm.footerText} onChange={(v) => setLegalForm((p) => ({ ...p, footerText: v }))} />
          <Textarea label="Politicas" value={legalForm.privacyPolicyText} onChange={(v) => setLegalForm((p) => ({ ...p, privacyPolicyText: v }))} />
          <Textarea label="Terminos" value={legalForm.termsText} onChange={(v) => setLegalForm((p) => ({ ...p, termsText: v }))} />
        </div>
        <button disabled={!selectedId} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
          <Save size={17} />
          Guardar configuracion
        </button>
      </form>

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

function Input({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
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

function businessTypeLabel(value) {
  return BUSINESS_TYPES.find((option) => option.value === value)?.label ?? "Automotriz / taller";
}

function terminologyProfileLabel(value) {
  return TERMINOLOGY_PROFILES.find((option) => option.value === value)?.label ?? "Automotriz";
}
