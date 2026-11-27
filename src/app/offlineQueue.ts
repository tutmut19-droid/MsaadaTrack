import type { SupabaseClient } from "@supabase/supabase-js";

export type PendingBeneficiary = {
  full_name: string;
  national_id: string | null;
  phone: string | null;
  location: string | null;
  household_size: number;
};

const KEY = "msaadatrack_pending_beneficiaries";

export function getPending(): PendingBeneficiary[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addPending(item: PendingBeneficiary) {
  const list = getPending();
  list.push(item);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export async function syncPending(supabase: SupabaseClient): Promise<number> {
  const list = getPending();
  const remaining: PendingBeneficiary[] = [];
  let synced = 0;
  for (const item of list) {
    const { error } = await supabase.from("beneficiaries").insert([item]);
    // 23505 = already registered (duplicate ID), so drop it from the queue
    if (error && error.code !== "23505") remaining.push(item);
    else synced++;
  }
  localStorage.setItem(KEY, JSON.stringify(remaining));
  return synced;
}