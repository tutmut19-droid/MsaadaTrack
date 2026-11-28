import Link from "next/link";

const inventory = [
  { name: "Maize flour", unit: "bags", quantity: 180, status: "Available" },
  { name: "Rice", unit: "kg", quantity: 250, status: "Available" },
  { name: "Cooking oil", unit: "litres", quantity: 96, status: "Available" },
  { name: "Blankets", unit: "pieces", quantity: 24, status: "Low stock" },
];

const distributions = [
  { ref: "DST-DEMO-0048", household: "Demo Household 004", item: "Maize flour", quantity: "2 bags", date: "28 Nov 2026" },
  { ref: "DST-DEMO-0047", household: "Demo Household 003", item: "Cooking oil", quantity: "1 litre", date: "27 Nov 2026" },
  { ref: "DST-DEMO-0046", household: "Demo Household 002", item: "Rice", quantity: "5 kg", date: "27 Nov 2026" },
  { ref: "DST-DEMO-0045", household: "Demo Household 001", item: "Blankets", quantity: "1 piece", date: "26 Nov 2026" },
];

const households = [
  { ref: "HH-DEMO-001", location: "Kalobeyei – Zone 1", members: 5 },
  { ref: "HH-DEMO-002", location: "Kakuma – Zone 2", members: 4 },
  { ref: "HH-DEMO-003", location: "Kalobeyei – Zone 3", members: 6 },
  { ref: "HH-DEMO-004", location: "Kakuma – Zone 1", members: 3 },
];

export default function PublicDemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">MsaadaTrack</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Relief Operations Demo</h1>
            <p className="mt-1 text-sm text-slate-600">A read-only preview of aid inventory and distribution tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">Public read-only demo</span>
            <Link href="/" className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-emerald-700">Staff sign in</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-emerald-950">Explore how MsaadaTrack works</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-emerald-900">
                This demonstration uses fictional sample records. You can review stock levels, household references and distribution history, but you cannot add, edit or delete records.
              </p>
            </div>
            <span className="mt-1 inline-flex w-fit rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm">No sign-in required</span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Demo summary">
          {[
            { label: "Demo households", value: "4", note: "Fictional sample records" },
            { label: "Aid item types", value: "4", note: "Illustrative inventory" },
            { label: "Sample distributions", value: "48", note: "Illustrative activity count" },
            { label: "Access mode", value: "View only", note: "Changes are disabled" },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.note}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-950">Current aid stock</h2>
            <p className="mt-1 text-xs text-slate-500">Sample stock balances for demonstration only</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3 font-semibold">Aid item</th><th className="px-5 py-3 font-semibold">Available quantity</th><th className="px-5 py-3 font-semibold">Stock status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr key={item.name}>
                    <td className="px-5 py-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-5 py-4 tabular-nums text-slate-700">{item.quantity} {item.unit}</td>
                    <td className="px-5 py-4"><span className={item.status === "Low stock" ? "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800" : "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-slate-950">Recent distribution activity</h2>
              <p className="mt-1 text-xs text-slate-500">Fictional sample transactions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3 font-semibold">Reference / household</th><th className="px-5 py-3 font-semibold">Aid issued</th><th className="px-5 py-3 font-semibold">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {distributions.map((row) => (
                    <tr key={row.ref}>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-800">{row.household}</p><p className="mt-1 text-xs text-slate-500">{row.ref}</p></td>
                      <td className="px-5 py-4 text-slate-700">{row.quantity} {row.item}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-slate-950">Sample household register</h2>
              <p className="mt-1 text-xs text-slate-500">No real names, phone numbers or national IDs are displayed</p>
            </div>
            <div className="divide-y divide-slate-100">
              {households.map((household) => (
                <div key={household.ref} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div><p className="font-semibold text-slate-800">{household.ref}</p><p className="mt-1 text-xs text-slate-500">{household.location}</p></div>
                  <span className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{household.members} members</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="border-t border-slate-200 py-5 text-center text-xs leading-5 text-slate-500">
          MsaadaTrack public demonstration • All records on this page are fictional sample data and are not connected to live beneficiary records.
        </footer>
      </div>
    </main>
  );
}
