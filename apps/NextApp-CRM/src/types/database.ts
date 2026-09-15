export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          logo_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          logo_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          logo_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          branch_code: string
          branch_name: string | null
          company_name: string | null
          branch_address: string | null
          branch_phone: string | null
          branch_email: string | null
          branch_manager: string | null
          branch_url: string | null
          branch_manager_mobile: string | null
          store_image: string | null
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          branch_code: string
          branch_name?: string | null
          company_name?: string | null
          branch_address?: string | null
          branch_phone?: string | null
          branch_email?: string | null
          branch_manager?: string | null
          branch_url?: string | null
          branch_manager_mobile?: string | null
          store_image?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          branch_code?: string
          branch_name?: string | null
          company_name?: string | null
          branch_address?: string | null
          branch_phone?: string | null
          branch_email?: string | null
          branch_manager?: string | null
          branch_url?: string | null
          branch_manager_mobile?: string | null
          store_image?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          company_id: string | null
          store_id: string | null
          region_id: string | null
          retailer_id: number | null
          profile_image: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role: string
          company_id?: string | null
          store_id?: string | null
          region_id?: string | null
          retailer_id?: number | null
          profile_image?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          company_id?: string | null
          store_id?: string | null
          region_id?: string | null
          retailer_id?: number | null
          profile_image?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      retailers: {
        Row: {
          retailer_id: number
          retailer_crm_id: string | null
          retailer_name: string | null
          retailer_image: string | null
          retailer_address: string | null
          retailer_mobile: string | null
          retailer_tfat_id: string | null
          retailer_status: number | null
          area_name: string | null
          contact_person: string | null
          pincode: string | null
          mobile_order: string | null
          mobile_account: string | null
          owner_mobile: string | null
          area_id: number | null
          gst_no: string | null
          credit_limit: number | null
          type_id: number | null
          confirm: number | null
          retailer_tour_id: number | null
          retailer_email: string | null
          latitude: number | null
          longitude: number | null
          last_sync: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          retailer_id?: number
          retailer_crm_id?: string | null
          retailer_name?: string | null
          retailer_image?: string | null
          retailer_address?: string | null
          retailer_mobile?: string | null
          retailer_tfat_id?: string | null
          retailer_status?: number | null
          area_name?: string | null
          contact_person?: string | null
          pincode?: string | null
          mobile_order?: string | null
          mobile_account?: string | null
          owner_mobile?: string | null
          area_id?: number | null
          gst_no?: string | null
          credit_limit?: number | null
          type_id?: number | null
          confirm?: number | null
          retailer_tour_id?: number | null
          retailer_email?: string | null
          latitude?: number | null
          longitude?: number | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          retailer_id?: number
          retailer_crm_id?: string | null
          retailer_name?: string | null
          retailer_image?: string | null
          retailer_address?: string | null
          retailer_mobile?: string | null
          retailer_tfat_id?: string | null
          retailer_status?: number | null
          area_name?: string | null
          contact_person?: string | null
          pincode?: string | null
          mobile_order?: string | null
          mobile_account?: string | null
          owner_mobile?: string | null
          area_id?: number | null
          gst_no?: string | null
          credit_limit?: number | null
          type_id?: number | null
          confirm?: number | null
          retailer_tour_id?: number | null
          retailer_email?: string | null
          latitude?: number | null
          longitude?: number | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      parts: {
        Row: {
          part_number: string
          part_name: string | null
          part_price: number | null
          part_discount: string | null
          part_image: string | null
          part_min_qty: number | null
          part_basic_disc: number | null
          part_scheme_disc: number | null
          part_additional_disc: number | null
          part_application: string | null
          guru_point: number | null
          champion_point: number | null
          alternate_part_number: string | null
          t1: number | null
          t2: number | null
          t3: number | null
          t4: number | null
          t5: number | null
          is_order_pad: number | null
          item_status: string | null
          order_pad_category: number | null
          previous_part_number: string | null
          focus_group: string | null
          part_category: string | null
          last_sync: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          part_number: string
          part_name?: string | null
          part_price?: number | null
          part_discount?: string | null
          part_image?: string | null
          part_min_qty?: number | null
          part_basic_disc?: number | null
          part_scheme_disc?: number | null
          part_additional_disc?: number | null
          part_application?: string | null
          guru_point?: number | null
          champion_point?: number | null
          alternate_part_number?: string | null
          t1?: number | null
          t2?: number | null
          t3?: number | null
          t4?: number | null
          t5?: number | null
          is_order_pad?: number | null
          item_status?: string | null
          order_pad_category?: number | null
          previous_part_number?: string | null
          focus_group?: string | null
          part_category?: string | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          part_number?: string
          part_name?: string | null
          part_price?: number | null
          part_discount?: string | null
          part_image?: string | null
          part_min_qty?: number | null
          part_basic_disc?: number | null
          part_scheme_disc?: number | null
          part_additional_disc?: number | null
          part_application?: string | null
          guru_point?: number | null
          champion_point?: number | null
          alternate_part_number?: string | null
          t1?: number | null
          t2?: number | null
          t3?: number | null
          t4?: number | null
          t5?: number | null
          is_order_pad?: number | null
          item_status?: string | null
          order_pad_category?: number | null
          previous_part_number?: string | null
          focus_group?: string | null
          part_category?: string | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      item_status: {
        Row: {
          branch_code: string
          part_no: string
          part_branch: string
          part_a: string | null
          part_b: string | null
          part_c: string | null
          part_max: string | null
          part_rack: string | null
          last_sale: number | null
          last_purchase: number | null
          narr: string | null
          last_sync: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          branch_code: string
          part_no: string
          part_branch: string
          part_a?: string | null
          part_b?: string | null
          part_c?: string | null
          part_max?: string | null
          part_rack?: string | null
          last_sale?: number | null
          last_purchase?: number | null
          narr?: string | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          branch_code?: string
          part_no?: string
          part_branch?: string
          part_a?: string | null
          part_b?: string | null
          part_c?: string | null
          part_max?: string | null
          part_rack?: string | null
          last_sale?: number | null
          last_purchase?: number | null
          narr?: string | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      order_master: {
        Row: {
          order_id: number
          crm_order_id: string | null
          retailer_id: number | null
          transport_id: number | null
          transport_by: string | null
          place_by: string | null
          place_date: number | null
          confirm_by: string | null
          confirm_date: number | null
          pick_by: string | null
          pick_date: number | null
          pack_by: string | null
          checked_by: string | null
          pack_date: number | null
          delivered_by: string | null
          delivered_date: number | null
          order_status: string | null
          branch: string | null
          dispatch_id: number | null
          remark: string | null
          po_number: string | null
          po_date: number | null
          urgent_status: boolean | null
          longitude: number | null
          is_sync: boolean | null
          latitude: number | null
          last_sync: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          order_id?: number
          crm_order_id?: string | null
          retailer_id?: number | null
          transport_id?: number | null
          transport_by?: string | null
          place_by?: string | null
          place_date?: number | null
          confirm_by?: string | null
          confirm_date?: number | null
          pick_by?: string | null
          pick_date?: number | null
          pack_by?: string | null
          checked_by?: string | null
          pack_date?: number | null
          delivered_by?: string | null
          delivered_date?: number | null
          order_status?: string | null
          branch?: string | null
          dispatch_id?: number | null
          remark?: string | null
          po_number?: string | null
          po_date?: number | null
          urgent_status?: boolean | null
          longitude?: number | null
          is_sync?: boolean | null
          latitude?: number | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          order_id?: number
          crm_order_id?: string | null
          retailer_id?: number | null
          transport_id?: number | null
          transport_by?: string | null
          place_by?: string | null
          place_date?: number | null
          confirm_by?: string | null
          confirm_date?: number | null
          pick_by?: string | null
          pick_date?: number | null
          pack_by?: string | null
          checked_by?: string | null
          pack_date?: number | null
          delivered_by?: string | null
          delivered_date?: number | null
          order_status?: string | null
          branch?: string | null
          dispatch_id?: number | null
          remark?: string | null
          po_number?: string | null
          po_date?: number | null
          urgent_status?: boolean | null
          longitude?: number | null
          is_sync?: boolean | null
          latitude?: number | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          order_item_id: number
          order_id: number | null
          order_srl: number | null
          part_admin: string | null
          part_salesman: string | null
          order_qty: number | null
          dispatch_qty: number | null
          pick_date: number | null
          pick_by: string | null
          order_item_status: string | null
          place_date: number | null
          retailer_id: number | null
          item_amount: number | null
          scheme_disc: number | null
          additional_disc: number | null
          discount: number | null
          mrp: number | null
          first_order_date: number | null
          urgent_status: boolean | null
          last_sync: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          order_item_id?: number
          order_id?: number | null
          order_srl?: number | null
          part_admin?: string | null
          part_salesman?: string | null
          order_qty?: number | null
          dispatch_qty?: number | null
          pick_date?: number | null
          pick_by?: string | null
          order_item_status?: string | null
          place_date?: number | null
          retailer_id?: number | null
          item_amount?: number | null
          scheme_disc?: number | null
          additional_disc?: number | null
          discount?: number | null
          mrp?: number | null
          first_order_date?: number | null
          urgent_status?: boolean | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          order_item_id?: number
          order_id?: number | null
          order_srl?: number | null
          part_admin?: string | null
          part_salesman?: string | null
          order_qty?: number | null
          dispatch_qty?: number | null
          pick_date?: number | null
          pick_by?: string | null
          order_item_status?: string | null
          place_date?: number | null
          retailer_id?: number | null
          item_amount?: number | null
          scheme_disc?: number | null
          additional_disc?: number | null
          discount?: number | null
          mrp?: number | null
          first_order_date?: number | null
          urgent_status?: boolean | null
          last_sync?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      regions: {
        Row: {
          id: string
          name: string
          store_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          store_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          store_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transport: {
        Row: {
          id: number
          store_id: string | null
          type: string | null
          provider: string | null
          contact_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          store_id?: string | null
          type?: string | null
          provider?: string | null
          contact_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          store_id?: string | null
          type?: string | null
          provider?: string | null
          contact_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          action?: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}