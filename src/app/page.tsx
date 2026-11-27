'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Beneficiary = {
  id: string;
  full_name: string;
  national_id: string | null;
  phone: string | null;
  location: string | null;
  household_size: number;
  created_at: string;
};

type AidItem = {
  id: string;
  name: string;
  unit: string;
  stock_quantity: number;
};

type Distribution = {
  id: string;
  quantity: number;
  notes: string | null;
  distributed_at: string;
  beneficiaries: { full_name: string; location: string | null } | null;
  aid_items: { name: string; unit: string } | null;
};

function matchesNameOrId(beneficiary: Beneficiary, query: string): boolean {
  if (!query) return true;
  const nameMatch = beneficiary.full_name.toLowerCase().includes(query);
  const idMatch = (beneficiary.national_id ?? '').toLowerCase().includes(query);
  return nameMatch || idMatch;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard data state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [aidItems, setAidItems] = useState<AidItem[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [distributionBeneficiarySearch, setDistributionBeneficiarySearch] =
    useState('');

  // Beneficiary form state
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [householdSize, setHouseholdSize] = useState(1);

  // Distribution form state
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [selectedAidItem, setSelectedAidItem] = useState('');
  const [distQuantity, setDistQuantity] = useState(1);
  const [distNotes, setDistNotes] = useState('');

  // Restock form state
  const [restockItemId, setRestockItemId] = useState('');
  const [restockAmount, setRestockAmount] = useState(50);

  // New Aid Item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemStock, setNewItemStock] = useState(50);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchAllData() {
    const [bRes, aRes, dRes] = await Promise.all([
      supabase
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('aid_items').select('*').order('name', { ascending: true }),
      supabase
        .from('distributions')
        .select(
          'id, quantity, notes, distributed_at, beneficiaries(full_name, location), aid_items(name, unit)'
        )
        .order('distributed_at', { ascending: false }),
    ]);

    if (bRes.error) setErrorMsg(bRes.error.message);
    if (bRes.data) {
      setBeneficiaries(bRes.data);
      if (bRes.data.length > 0 && !selectedBeneficiary) {
        setSelectedBeneficiary(bRes.data[0].id);
      }
    }

    if (aRes.data) {
      setAidItems(aRes.data);
      if (aRes.data.length > 0) {
        if (!selectedAidItem) setSelectedAidItem(aRes.data[0].id);
        if (!restockItemId) setRestockItemId(aRes.data[0].id);
      }
    }

    if (dRes.data) {
      setDistributions(dRes.data as unknown as Distribution[]);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
      if (data.session) {
        fetchAllData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      if (nextSession) {
        fetchAllData();
      } else {
        setBeneficiaries([]);
        setAidItems([]);
        setDistributions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const normalizedDistSearch = distributionBeneficiarySearch
    .trim()
    .toLowerCase();
  const distributionBeneficiaryOptions = beneficiaries.filter((b) =>
    matchesNameOrId(b, normalizedDistSearch)
  );

  const activeBeneficiary =
    beneficiaries.find((b) => b.id === selectedBeneficiary) ?? null;

  useEffect(() => {
    if (distributionBeneficiaryOptions.length === 0) {
      if (selectedBeneficiary) setSelectedBeneficiary('');
      return;
    }

    const stillMatches = distributionBeneficiaryOptions.some(
      (b) => b.id === selectedBeneficiary
    );
    if (!stillMatches) {
      setSelectedBeneficiary(distributionBeneficiaryOptions[0].id);
    }
  }, [distributionBeneficiaryOptions, selectedBeneficiary]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoginLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoginLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setPassword('');
    setSuccessMsg('Signed in as staff.');
  }

  async function handleSignOut() {
    setErrorMsg('');
    setSuccessMsg('');
    await supabase.auth.signOut();
  }

  async function handleRegisterBeneficiary(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!fullName.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('beneficiaries').insert([
      {
        full_name: fullName.trim(),
        national_id: nationalId.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        household_size: Number(householdSize) || 1,
      },
    ]);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setFullName('');
    setNationalId('');
    setPhone('');
    setLocation('');
    setHouseholdSize(1);
    setSuccessMsg('Beneficiary registered successfully.');
    fetchAllData();
  }

  async function handleRecordDistribution(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedBeneficiary || !selectedAidItem) {
      setErrorMsg('Please select both a beneficiary and an aid item.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('distributions').insert([
      {
        beneficiary_id: selectedBeneficiary,
        aid_item_id: selectedAidItem,
        quantity: Number(distQuantity),
        notes: distNotes.trim() || null,
      },
    ]);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setDistQuantity(1);
    setDistNotes('');
    setDistributionBeneficiarySearch('');
    setSuccessMsg('Distribution recorded and stock updated!');
    fetchAllData();
  }

  async function handleRestockAidItem(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const target = aidItems.find((item) => item.id === restockItemId);
    const addedQty = Number(restockAmount);

    if (!target || addedQty <= 0) {
      setErrorMsg('Select an aid item and enter a restock quantity above 0.');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('aid_items')
      .update({ stock_quantity: target.stock_quantity + addedQty })
      .eq('id', target.id);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setRestockAmount(50);
    setSuccessMsg(`Restocked ${addedQty} ${target.unit} of ${target.name}.`);
    fetchAllData();
  }

  async function handleAddAidItem(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newItemName.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('aid_items').insert([
      {
        name: newItemName.trim(),
        unit: newItemUnit.trim() || 'units',
        stock_quantity: Number(newItemStock) || 0,
      },
    ]);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setNewItemName('');
    setNewItemUnit('kg');
    setNewItemStock(50);
    setSuccessMsg('New aid item added to inventory.');
    fetchAllData();
  }

  function handleExportCsv() {
    if (distributions.length === 0) {
      setErrorMsg('No distributions to export yet.');
      return;
    }

    const headers = [
      'Distributed At',
      'Beneficiary Name',
      'Location / Ward',
      'Aid Item',
      'Quantity',
      'Unit',
      'Notes',
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = distributions.map((d) => [
      escapeCsv(new Date(d.distributed_at).toISOString()),
      escapeCsv(d.beneficiaries?.full_name || 'Unknown'),
      escapeCsv(d.beneficiaries?.location || ''),
      escapeCsv(d.aid_items?.name || 'Unknown'),
      escapeCsv(d.quantity),
      escapeCsv(d.aid_items?.unit || ''),
      escapeCsv(d.notes || ''),
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'msaadatrack-distributions.csv';
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMsg('Exported distributions CSV report.');
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredBeneficiaries = normalizedSearch
    ? beneficiaries.filter((b) =>
        [b.full_name, b.national_id, b.location, b.phone]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(normalizedSearch))
      )
    : beneficiaries;

  if (authLoading) {
    return (
      <main className="mx-auto max-w-md p-6 font-sans">
        <p className="text-sm text-gray-600">Checking staff session...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-md p-6 font-sans">
        <div className="mt-10 rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">
            MsaadaTrack — Staff Sign In
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Sign in with your authorized staff account to manage beneficiaries,
            stock, and distributions.
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignIn} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Staff Email
              </label>
              <input
                type="email"
                required
                placeholder="staff@msaadatrack.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 font-sans">
      <header className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            MsaadaTrack — Relief Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Signed in as{' '}
            <span className="font-medium text-gray-900">
              {session.user.email}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
          >
            Export Distributions CSV
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Live Inventory Summary */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">
          Current Aid Stock
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {aidItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-600">{item.name}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {item.stock_quantity}{' '}
                <span className="text-sm font-normal text-gray-500">
                  {item.unit}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Forms Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Record Aid Distribution Form */}
        <section className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Record Aid Distribution
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Automatically deducts quantity from available stock.
          </p>

          <form onSubmit={handleRecordDistribution} className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-xs font-medium text-gray-700">
                  Search Beneficiary (Name or National ID)
                </label>
                {distributionBeneficiarySearch && (
                  <button
                    type="button"
                    onClick={() => setDistributionBeneficiarySearch('')}
                    className="text-xs font-medium text-blue-700 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Search by beneficiary name or National ID..."
                value={distributionBeneficiarySearch}
                onChange={(e) =>
                  setDistributionBeneficiarySearch(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Select Beneficiary * ({distributionBeneficiaryOptions.length}{' '}
                {distributionBeneficiaryOptions.length === 1
                  ? 'match'
                  : 'matches'}
                )
              </label>
              <select
                value={selectedBeneficiary}
                onChange={(e) => setSelectedBeneficiary(e.target.value)}
                disabled={distributionBeneficiaryOptions.length === 0}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
              >
                {distributionBeneficiaryOptions.length === 0 ? (
                  <option value="">No matching name or National ID</option>
                ) : (
                  distributionBeneficiaryOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.full_name} — ID: {b.national_id || 'N/A'} (
                      {b.location || 'No ward'})
                    </option>
                  ))
                )}
              </select>
              {activeBeneficiary && (
                <p className="mt-1.5 text-xs text-gray-600">
                  Selected:{' '}
                  <span className="font-medium text-gray-900">
                    {activeBeneficiary.full_name}
                  </span>{' '}
                  • ID: {activeBeneficiary.national_id || 'N/A'} • Ward:{' '}
                  {activeBeneficiary.location || 'N/A'} • HH:{' '}
                  {activeBeneficiary.household_size}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Relief Item *
                </label>
                <select
                  value={selectedAidItem}
                  onChange={(e) => setSelectedAidItem(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {aidItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.stock_quantity} {item.unit} left)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Quantity Distributed *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={distQuantity}
                  onChange={(e) => setDistQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Distribution Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Monthly food ration cycle 1"
                value={distNotes}
                onChange={(e) => setDistNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBeneficiary}
              className="w-full rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Log Distribution'}
            </button>
          </form>
        </section>

        {/* Register Beneficiary Form */}
        <section className="rounded-xl border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Register New Beneficiary
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Add a household head to the beneficiary registry.
          </p>

          <form onSubmit={handleRegisterBeneficiary} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amina Hassan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  National ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12345678"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Location / Ward
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kalobeyei / Ward 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Household Size (Number of Members)
                </label>
                <input
                  type="number"
                  min={1}
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Register Beneficiary'}
            </button>
          </form>
        </section>
      </div>

      {/* Restock Existing Aid Item & Add New Relief Stock Item */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            Restock Existing Aid Item
          </h2>
          <form
            onSubmit={handleRestockAidItem}
            className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <select
              value={restockItemId}
              onChange={(e) => setRestockItemId(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {aidItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.stock_quantity} {item.unit})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              required
              placeholder="Add quantity"
              value={restockAmount}
              onChange={(e) => setRestockAmount(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading || aidItems.length === 0}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              + Restock
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            Add New Aid Item to Inventory
          </h2>
          <form
            onSubmit={handleAddAidItem}
            className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <input
              type="text"
              required
              placeholder="Item name (e.g. Rice)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            <input
              type="text"
              required
              placeholder="Unit (e.g. kg, boxes)"
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              required
              placeholder="Initial stock"
              value={newItemStock}
              onChange={(e) => setNewItemStock(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add Item
            </button>
          </form>
        </section>
      </div>

      {/* Distribution Log & Beneficiaries List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Distributions ({distributions.length})
          </h2>
          {distributions.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              No distributions logged yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {distributions.map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      {d.beneficiaries?.full_name || 'Unknown'}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {d.quantity} {d.aid_items?.unit} {d.aid_items?.name}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(d.distributed_at).toLocaleString()}
                    {d.notes ? ` • ${d.notes}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Registered Beneficiaries ({filteredBeneficiaries.length})
            </h2>
            <input
              type="text"
              placeholder="Search name, ID, or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs sm:w-56"
            />
          </div>

          {filteredBeneficiaries.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              No matching beneficiaries found.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {filteredBeneficiaries.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{b.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {b.location || 'No location'} • Household:{' '}
                      {b.household_size}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {b.national_id || 'No ID'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}