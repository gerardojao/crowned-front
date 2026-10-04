import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Landmark, LoaderCircle, Plus, Save, Settings, Trash2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../Components/api";

const emptyUser = { email: "", fullName: "", password: "", role: "user" };
const emptyBank = { nombre: "", iban: "", esPrincipal: false, activo: true };

function errorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default function ManagerSettings() {
  const [workshop, setWorkshop] = useState(null);
  const [users, setUsers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [newUser, setNewUser] = useState(emptyUser);
  const [newBank, setNewBank] = useState(emptyBank);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [savingBankId, setSavingBankId] = useState(null);
  const [creatingBank, setCreatingBank] = useState(false);
  const [notice, setNotice] = useState(null);

  const activeUsers = useMemo(
    () => users.filter((user) => user.active ?? user.Active).length,
    [users],
  );

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get("/WorkshopSettings"),
      api.get("/WorkshopUsers"),
      api.get("/WorkshopBankAccounts"),
    ])
      .then(([settingsResponse, usersResponse, banksResponse]) => {
        if (!alive) return;
        setWorkshop(settingsResponse.data);
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
        setBanks(Array.isArray(banksResponse.data) ? banksResponse.data : []);
      })
      .catch((error) => {
        if (alive) setNotice({ type: "error", text: errorMessage(error, "No se pudo cargar la configuración.") });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const updateLocalUser = (id, field, value) => {
    setUsers((current) => current.map((user) =>
      String(user.id ?? user.Id) === String(id) ? { ...user, [field]: value } : user,
    ));
  };

  const saveUser = async (user) => {
    const id = user.id ?? user.Id;
    setSavingId(id);
    setNotice(null);
    try {
      const response = await api.put(`/WorkshopUsers/${id}`, {
        fullName: user.fullName ?? user.FullName ?? "",
        role: user.role ?? user.Role ?? "user",
        active: user.active ?? user.Active ?? false,
        password: user.password || undefined,
      });
      setUsers(Array.isArray(response.data) ? response.data : []);
      setNotice({ type: "success", text: "Usuario actualizado." });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error, "No se pudo actualizar el usuario.") });
    } finally {
      setSavingId(null);
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    setCreating(true);
    setNotice(null);
    try {
      const response = await api.post("/WorkshopUsers", newUser);
      setUsers(Array.isArray(response.data) ? response.data : []);
      setNewUser(emptyUser);
      setNotice({ type: "success", text: "Usuario añadido." });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error, "No se pudo añadir el usuario.") });
    } finally {
      setCreating(false);
    }
  };

  const updateLocalBank = (id, field, value) => {
    setBanks((current) => current.map((bank) => {
      const isSelected = String(bank.id ?? bank.Id) === String(id);
      if (field === "esPrincipal" && value) {
        return { ...bank, esPrincipal: isSelected };
      }
      return isSelected ? { ...bank, [field]: value } : bank;
    }));
  };

  const bankPayload = (bank, active = true) => ({
    nombre: bank.nombre ?? bank.Nombre ?? "",
    iban: bank.iban ?? bank.Iban ?? "",
    esPrincipal: bank.esPrincipal ?? bank.EsPrincipal ?? false,
    activo: active,
  });

  const saveBank = async (bank) => {
    const id = bank.id ?? bank.Id;
    setSavingBankId(id);
    setNotice(null);
    try {
      const response = await api.put(`/WorkshopBankAccounts/${id}`, bankPayload(bank));
      setBanks(Array.isArray(response.data) ? response.data.filter((item) => item.activo ?? item.Activo) : []);
      setNotice({ type: "success", text: "Cuenta bancaria actualizada." });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error, "No se pudo actualizar la cuenta bancaria.") });
    } finally {
      setSavingBankId(null);
    }
  };

  const removeBank = async (bank) => {
    if (!window.confirm("¿Quieres eliminar esta cuenta bancaria?")) return;
    const id = bank.id ?? bank.Id;
    setSavingBankId(id);
    setNotice(null);
    try {
      const response = await api.put(`/WorkshopBankAccounts/${id}`, bankPayload(bank, false));
      setBanks(Array.isArray(response.data) ? response.data.filter((item) => item.activo ?? item.Activo) : []);
      setNotice({ type: "success", text: "Cuenta bancaria eliminada." });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error, "No se pudo eliminar la cuenta bancaria.") });
    } finally {
      setSavingBankId(null);
    }
  };

  const createBank = async (event) => {
    event.preventDefault();
    setCreatingBank(true);
    setNotice(null);
    try {
      const response = await api.post("/WorkshopBankAccounts", newBank);
      setBanks(Array.isArray(response.data) ? response.data.filter((item) => item.activo ?? item.Activo) : []);
      setNewBank(emptyBank);
      setNotice({ type: "success", text: "Cuenta bancaria añadida." });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error, "No se pudo añadir la cuenta bancaria.") });
    } finally {
      setCreatingBank(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[45vh] items-center justify-center"><LoaderCircle className="animate-spin text-emerald-600" size={32} /></div>;
  }

  const workshopName = workshop?.nombre ?? workshop?.Nombre ?? "Mi negocio";
  const maxUsers = workshop?.maxUsers ?? workshop?.MaxUsers ?? 3;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700"><Settings size={17} /> Configuración</div>
          <h1 className="text-3xl font-bold text-slate-900">{workshopName}</h1>
          <p className="mt-1 text-slate-600">Gestiona los usuarios y las cuentas bancarias de este negocio.</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={17} /> Volver
        </Link>
      </div>

      {notice && (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {notice.text}
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Landmark className="text-sky-600" size={21} />
          <h2 className="text-lg font-bold text-slate-900">Cuentas bancarias</h2>
        </div>

        <div className="space-y-3">
          {banks.length === 0 && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Todavía no hay cuentas bancarias configuradas.</p>
          )}
          {banks.map((bank) => {
            const id = bank.id ?? bank.Id;
            const isMain = bank.esPrincipal ?? bank.EsPrincipal ?? false;
            return (
              <div key={id} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1.5fr_auto_auto_auto] md:items-end">
                <label className="text-xs font-semibold text-slate-500">Nombre<input value={bank.nombre ?? bank.Nombre ?? ""} onChange={(event) => updateLocalBank(id, "nombre", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="text-xs font-semibold text-slate-500">IBAN<input value={bank.iban ?? bank.Iban ?? ""} onChange={(event) => updateLocalBank(id, "iban", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase" /></label>
                <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-slate-600"><input type="radio" name="main-bank" checked={Boolean(isMain)} onChange={() => updateLocalBank(id, "esPrincipal", true)} /> Principal</label>
                <button type="button" disabled={savingBankId === id} onClick={() => saveBank(bank)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Save size={16} /> Guardar</button>
                <button type="button" disabled={savingBankId === id} onClick={() => removeBank(bank)} aria-label="Eliminar cuenta bancaria" title="Eliminar" className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={18} /></button>
              </div>
            );
          })}
        </div>

        <form onSubmit={createBank} className="mt-5 border-t border-slate-200 pt-5">
          <h3 className="mb-3 font-bold text-slate-800">Añadir cuenta bancaria</h3>
          <div className="grid gap-4 md:grid-cols-[1fr_1.5fr_auto_auto] md:items-end">
            <label className="text-sm font-semibold text-slate-700">Nombre<input required value={newBank.nombre} onChange={(event) => setNewBank({ ...newBank, nombre: event.target.value })} placeholder="Ej. Cuenta principal" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
            <label className="text-sm font-semibold text-slate-700">IBAN<input required value={newBank.iban} onChange={(event) => setNewBank({ ...newBank, iban: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 uppercase" /></label>
            <label className="flex items-center gap-2 pb-2.5 text-sm font-semibold text-slate-600"><input type="checkbox" checked={newBank.esPrincipal} onChange={(event) => setNewBank({ ...newBank, esPrincipal: event.target.checked })} /> Principal</label>
            <button disabled={creatingBank} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"><Plus size={18} /> {creatingBank ? "Añadiendo..." : "Añadir"}</button>
          </div>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Users className="text-emerald-600" size={21} /><h2 className="text-lg font-bold text-slate-900">Usuarios</h2></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{activeUsers}/{maxUsers} activos</span>
        </div>
        <div className="space-y-3">
          {users.map((user) => {
            const id = user.id ?? user.Id;
            const manageable = user.manageable ?? user.Manageable;
            const active = user.active ?? user.Active;
            return (
              <div key={id} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1.4fr_1.2fr_0.8fr_auto_auto] md:items-end">
                <label className="text-xs font-semibold text-slate-500">Email<input value={user.email ?? user.Email ?? ""} disabled className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600" /></label>
                <label className="text-xs font-semibold text-slate-500">Nombre<input value={user.fullName ?? user.FullName ?? ""} disabled={!manageable} onChange={(event) => updateLocalUser(id, "fullName", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50" /></label>
                <label className="text-xs font-semibold text-slate-500">Rol<select value={user.role ?? user.Role ?? "user"} disabled={!manageable} onChange={(event) => updateLocalUser(id, "role", event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"><option value="user">Usuario</option><option value="mechanic">Mecánico</option><option value="viewer">Consulta</option></select></label>
                <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={Boolean(active)} disabled={!manageable} onChange={(event) => updateLocalUser(id, "active", event.target.checked)} /> Activo</label>
                <button type="button" disabled={!manageable || savingId === id} onClick={() => saveUser(user)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} /> Guardar</button>
              </div>
            );
          })}
        </div>
      </section>

      <form onSubmit={createUser} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><Plus className="text-orange-600" size={21} /><h2 className="text-lg font-bold text-slate-900">Añadir usuario</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Email<input type="email" required value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-semibold text-slate-700">Nombre<input value={newUser.fullName} onChange={(event) => setNewUser({ ...newUser, fullName: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-semibold text-slate-700">Contraseña<input type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} placeholder="Requerida si el usuario es nuevo" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
          <label className="text-sm font-semibold text-slate-700">Rol<select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="user">Usuario</option><option value="mechanic">Mecánico</option><option value="viewer">Consulta</option></select></label>
        </div>
        <button disabled={creating || activeUsers >= maxUsers} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={18} /> {creating ? "Añadiendo..." : "Añadir usuario"}</button>
      </form>
    </main>
  );
}
