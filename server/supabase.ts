import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Appointment, ContactMessage } from '../src/types.js';

// User's Supabase Project Credentials
export const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'ygugxkvtftqhymrxgtgo';
export const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_w4Mgsi-wsx9i9h3HdWkG1Q_S8_lZtyl';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export interface SupabaseStatus {
  connected: boolean;
  projectId: string;
  url: string;
  tableExists: boolean;
  error?: string;
  tableCheckMessage?: string;
}

// Check connectivity & table presence
export async function checkSupabaseStatus(): Promise<SupabaseStatus> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('appointments').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return {
          connected: true,
          projectId: SUPABASE_PROJECT_ID,
          url: SUPABASE_URL,
          tableExists: false,
          tableCheckMessage: "Table 'public.appointments' not found in your Supabase project. Please run the SQL schema script in your Supabase SQL Editor."
        };
      }
      return {
        connected: false,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        tableExists: false,
        error: error.message
      };
    }

    return {
      connected: true,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      tableExists: true
    };
  } catch (err: any) {
    return {
      connected: false,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      tableExists: false,
      error: err.message || 'Unknown network error connecting to Supabase'
    };
  }
}

// Convert Appointment to Supabase table row
function formatAppointmentRow(apt: Appointment) {
  return {
    id: apt.id,
    reference: apt.reference,
    service_id: apt.serviceId,
    service_name: apt.serviceName,
    staff_id: apt.staffId,
    staff_name: apt.staffName,
    date: apt.date,
    start_time: apt.startTime,
    end_time: apt.endTime,
    duration_minutes: apt.durationMinutes,
    price_inr: apt.priceINR,
    customer_name: apt.customerName,
    customer_phone: apt.customerPhone,
    customer_email: apt.customerEmail,
    customer_notes: apt.customerNotes || null,
    status: apt.status,
    cancellation_reason: apt.cancellationReason || null,
    created_at: apt.createdAt,
    updated_at: apt.updatedAt
  };
}

// Save appointment to Supabase
export async function syncAppointmentToSupabase(apt: Appointment): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const row = formatAppointmentRow(apt);

    const { error } = await supabase
      .from('appointments')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn(`[Supabase Sync Warning] Could not save appointment ${apt.reference}:`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase Sync Success] Appointment ${apt.reference} saved to Supabase.`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Supabase Sync Error] Exception saving appointment ${apt.reference}:`, err.message);
    return { success: false, error: err.message };
  }
}

// Save contact inquiry to Supabase
export async function syncContactMessageToSupabase(msg: ContactMessage): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        id: msg.id,
        name: msg.name,
        phone: msg.phone,
        email: msg.email,
        subject: msg.subject,
        message: msg.message,
        created_at: msg.createdAt
      });

    if (error) {
      console.warn(`[Supabase Message Sync Warning] Could not save message:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Sync all appointments to Supabase in bulk
export async function syncAllAppointments(appointments: Appointment[]): Promise<{
  total: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  if (appointments.length === 0) {
    return { total: 0, synced: 0, failed: 0, errors: [] };
  }

  const supabase = getSupabaseClient();
  const rows = appointments.map(formatAppointmentRow);

  try {
    const { error } = await supabase
      .from('appointments')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      return {
        total: appointments.length,
        synced: 0,
        failed: appointments.length,
        errors: [error.message]
      };
    }

    return {
      total: appointments.length,
      synced: appointments.length,
      failed: 0,
      errors: []
    };
  } catch (err: any) {
    return {
      total: appointments.length,
      synced: 0,
      failed: appointments.length,
      errors: [err.message]
    };
  }
}
