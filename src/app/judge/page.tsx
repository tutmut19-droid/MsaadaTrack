'use client';

import { useEffect, useMemo, useState } from 'react';

type Beneficiary = {
  id: string;
  fullName: string;
  reference: string;
  location: string;
  householdSize: number;
};
type AidItem = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};
type Distribution = {
  id: string;
  beneficiaryId: string;
  itemId: string;
  quantity: number;
  notes: string;
  date: string;
};

const STORAGE_KEY = 'msaadatrack-judge-sandbox-v1';
const initialBeneficiaries: Beneficiary[] = [
  { id: 'b-1001', fullName: 'Amina Hassan (Sample)', reference: 'TEST-1001', location: 'Kalobeyei - Zone 1', householdSize: 5 },
  { id: 'b-1002', fullName: 'Peter Lokiru (Sample)', reference: 'TEST-1002', location: 'Kakuma - Zone 2', householdSize: 4 },
  { id: 'b-1003', fullName: 'Mary Naserian (Sample)', reference: 'TEST-1003', location: 'Kakuma - Zone 3', householdSize: 6 },
];
const initialItems: AidItem[] = [
  { id: 'i-2001', name: 'Maize flour', unit: 'kg', stock: 250 },
  { id: 'i-2002', name: 'Cooking oil', unit: 'litres', stock: 120 },
  { id: 'i-2003', name: 'Beans', unit: 'kg', stock: 180 },
];
const initialDistributions: Distribution[] = [
  { id: 'd-3001', beneficiaryId: 'b-1001', itemId: 'i-2001', quantity: 10, notes: 'Sample monthly food ration', date: '2026-11-20T09:30:00.000Z' },
];

function makeId(prefix: string) {
  return prefix + '-' + Math.random().toString(36).slice(2, 9);
}

export default function JudgeSandboxPage() {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [items, setItems] = useState(initialItems);
  const [distributions, setDistributions] = useState(initialDistributions);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [fullName, setFullName] = useState('');
  const [reference, setReference] = useState('');
  const [location, setLocation] = useState('');
  const [householdSize, setHouseholdSize] = useState(1);

  const [itemName, setItemName] = useState('');
  const [itemUnit, setItemUnit] = useState('kg');
  const [itemStock, setItemStock] = useState(50);
  const [restockId, setRestockId] = useState(initialItems[0].id);
  const [restockAmount, setRestockAmount] = useState(20);

  const [distributionBeneficiary, setDistributionBeneficiary] = useState(initialBeneficiaries[0].id);
  const [distributionItem, setDistributionItem] = useState(initialItems[0].id);
  const [distributionQuantity, setDistributionQuantity] = useState(1);
  const [distributionNotes, setDistributionNotes] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.beneficiaries) && Array.isArray(parsed.items) && Array.isArray(parsed.distributions)) {
          setBeneficiaries(parsed.beneficiaries);
          setItems(parsed.items);
          setDistributions(parsed.distributions);
        }
      }
    } catch {
      // If saved test data is unreadable, continue with the safe sample dataset.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ beneficiaries, items, distributions }));
  }, [beneficiaries, items, distributions, ready]);

  const filteredBeneficiaries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return beneficiaries;
    return beneficiaries.filter((b) => [b.fullName, b.reference, b.location].some((v) => v.toLowerCase().includes(q)));
  }, [beneficiaries, search]);

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);

  function clearAlerts() {
    setMessage('');
    setError('');
  }

  function addBeneficiary(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearAlerts();
    if (!fullName.trim()) return setError('Enter a sample beneficiary name.');
    const entry: Beneficiary = {
      id: makeId('b'),
      fullName: fullName.trim() + (fullName.toLowerCase().includes('sample') ? '' : ' (Sample)'),
      reference: reference.trim() || makeId('TEST').toUpperCase(),
      location: location.trim() || 'Not specified',
      householdSize: Math.max(1, Number(householdSize) || 1),
    };
    setBeneficiaries((current) => [entry, ...current]);
    setFullName(''); setReference(''); setLocation(''); setHouseholdSize(1);
    setMessage('Sample beneficiary added to this browser.');
  }

  function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearAlerts();
    if (!itemName.trim() || Number(itemStock) < 0) return setError('Enter an item name and a valid opening stock.');
    const entry = { id: makeId('i'), name: itemName.trim(), unit: itemUnit.trim() || 'units', stock: Number(itemStock) };
    setItems((current) => [...current, entry]);
    setItemName(''); setItemUnit('kg'); setItemStock(50);
    setMessage('Sample aid item added to this browser.');
  }

  function restockItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearAlerts();
    if (!restockId || Number(restockAmount) <= 0) return setError('Choose an item and enter a restock quantity above zero.');
    setItems((current) => current.map((item) => item.id === restockId ? { ...item, stock: item.stock + Number(restockAmount) } : item));
    setMessage('Sample inventory restocked successfully.');
  }

  function recordDistribution(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearAlerts();
    const item = items.find((entry) => entry.id === distributionItem);
    const beneficiary = beneficiaries.find((entry) => entry.id === distributionBeneficiary);
    const qty = Number(distributionQuantity);
    if (!item || !beneficiary || qty <= 0) return setError('Select a beneficiary and aid item, then enter a quantity above zero.');
    if (qty > item.stock) return setError('Insufficient sample stock. Restock the item or enter a smaller quantity.');
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, stock: entry.stock - qty } : entry));
    setDistributions((current) => [{ id: makeId('d'), beneficiaryId: beneficiary.id, itemId: item.id, quantity: qty, notes: distributionNotes.trim(), date: new Date().toISOString() }, ...current]);
    setDistributionQuantity(1); setDistributionNotes('');
    setMessage('Sample distribution recorded and stock deducted.');
  }

  function resetSandbox() {
    if (!window.confirm('Reset this judge sandbox to its original fictional sample data? Your test changes in this browser will be cleared.')) return;
    setBeneficiaries(initialBeneficiaries);
    setItems(initialItems);
    setDistributions(initialDistributions);
    setSearch('');
    setMessage('Judge sandbox reset to the original sample data.');
    setError('');
  }

  function exportCsv() {
    const rows = [['Date', 'Beneficiary', 'Sample reference', 'Aid item', 'Quantity', 'Unit', 'Notes']];
    distributions.forEach((d) => {
      const b = beneficiaries.find((entry) => entry.id === d.beneficiaryId);
      const item = items.find((entry) => entry.id === d.itemId);
      rows.push([new Date(d.date).toISOString(), b?.fullName ?? 'Unknown', b?.reference ?? '', item?.name ?? 'Unknown', String(d.quantity), item?.unit ?? '', d.notes]);
    });
    const csv = rows.map((row) => row.map((value) => '"' + value.replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'msaadatrack-judge-sample-distributions.csv'; link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 font-sans text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-emerald-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Public judge workspace</p>
              <h1 className="mt-2 text-3xl font-bold">MsaadaTrack</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">Explore beneficiary registration, relief inventory and aid distribution using fictional sample records.</p>
            </div>
            <span className="w-fit rounded-full border border-emerald-300/40 bg-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-100">No sign-in required</span>
          </div>
          <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-950/20 p-3 text-sm text-amber-100">
            <strong>Testing environment only.</strong> All records here are fictional and saved only in this browser. Changes do not affect the protected staff system or its real data.
          </div>
        </header>

        {message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Sample beneficiaries</p><p className="mt-1 text-2xl font-bold">{beneficiaries.length}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Aid items</p><p className="mt-1 text-2xl font-bold">{items.length}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Total stock remaining</p><p className="mt-1 text-2xl font-bold">{totalStock}</p></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div><h2 className="text-lg font-semibold">1. Register a sample beneficiary</h2><p className="text-xs text-slate-500">Use fictional details only.</p></div>
            <form onSubmit={addBeneficiary} className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Alex Sample" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Sample reference<input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TEST-1004" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Location / ward<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Sample location" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Household size<input type="number" min="1" value={householdSize} onChange={(e) => setHouseholdSize(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <button className="self-end rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Add sample beneficiary</button>
            </form>
          </div>

          <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div><h2 className="text-lg font-semibold">2. Manage sample inventory</h2><p className="text-xs text-slate-500">Add new items or increase available stock.</p></div>
            <form onSubmit={addItem} className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm sm:col-span-3">New aid item<input required value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Soap" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Unit<input required value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <label className="text-sm">Opening stock<input type="number" min="0" required value={itemStock} onChange={(e) => setItemStock(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <button className="self-end rounded-lg bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-900">Add item</button>
            </form>
            <form onSubmit={restockItem} className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
              <label className="text-sm sm:col-span-2">Select item<select value={restockId} onChange={(e) => setRestockId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">{items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.stock} {item.unit})</option>)}</select></label>
              <label className="text-sm">Quantity to add<input type="number" min="1" value={restockAmount} onChange={(e) => setRestockAmount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              <button disabled={!items.length} className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 sm:col-span-3">Restock selected item</button>
            </form>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div><h2 className="text-lg font-semibold">3. Record an aid distribution</h2><p className="text-xs text-slate-500">The system checks stock and deducts the distributed quantity automatically.</p></div>
          <form onSubmit={recordDistribution} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm lg:col-span-2">Beneficiary<select value={distributionBeneficiary} onChange={(e) => setDistributionBeneficiary(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">{beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.fullName} — {b.reference}</option>)}</select></label>
            <label className="text-sm lg:col-span-1">Aid item<select value={distributionItem} onChange={(e) => setDistributionItem(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">{items.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.stock} {item.unit})</option>)}</select></label>
            <label className="text-sm">Quantity<input type="number" min="1" required value={distributionQuantity} onChange={(e) => setDistributionQuantity(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm">Notes<input value={distributionNotes} onChange={(e) => setDistributionNotes(e.target.value)} placeholder="Optional note" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <button disabled={!beneficiaries.length || !items.length} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 sm:col-span-2 lg:col-span-5">Record sample distribution</button>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Sample inventory</h2><span className="text-xs text-slate-500">Live sandbox totals</span></div>
            <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="py-2">Aid item</th><th className="py-2">Available stock</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="py-3 font-medium">{item.name}</td><td className="py-3">{item.stock} {item.unit}</td></tr>)}</tbody></table></div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Sample beneficiaries</h2><input aria-label="Search sample beneficiaries" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or reference" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs" /></div>
            <ul className="mt-3 divide-y divide-slate-100">{filteredBeneficiaries.map((b) => <li key={b.id} className="py-3"><p className="text-sm font-medium">{b.fullName}</p><p className="text-xs text-slate-500">{b.reference} · {b.location} · Household: {b.householdSize}</p></li>)}</ul>
            {filteredBeneficiaries.length === 0 && <p className="py-4 text-sm text-slate-500">No sample beneficiaries match your search.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Distribution history</h2><p className="text-xs text-slate-500">{distributions.length} sample records</p></div><button onClick={exportCsv} disabled={!distributions.length} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">Export sample CSV</button></div>
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b text-xs text-slate-500"><tr><th className="py-2">Date</th><th className="py-2">Beneficiary</th><th className="py-2">Aid item</th><th className="py-2">Quantity</th><th className="py-2">Notes</th></tr></thead><tbody>{distributions.map((d) => { const b = beneficiaries.find((entry) => entry.id === d.beneficiaryId); const item = items.find((entry) => entry.id === d.itemId); return <tr key={d.id} className="border-b last:border-0"><td className="py-3 text-xs text-slate-500">{new Date(d.date).toLocaleDateString()}</td><td className="py-3">{b?.fullName ?? 'Unknown'}</td><td className="py-3">{item?.name ?? 'Unknown'}</td><td className="py-3">{d.quantity} {item?.unit}</td><td className="py-3 text-xs text-slate-500">{d.notes || '—'}</td></tr>; })}</tbody></table></div>
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-slate-200 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>For demonstration only · MsaadaTrack public judge sandbox</p>
          <button onClick={resetSandbox} className="w-fit rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-white">Reset sample data</button>
        </footer>
      </div>
    </main>
  );
}
