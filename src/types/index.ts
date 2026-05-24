export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface Comment {
  id: string;
  transaction_id: string;
  user_id: string;
  user_name: string;
  user_role: 'cpa' | 'client' | 'admin';
  text: string;
  created_at: string;
  attachments?: Attachment[];
}

export interface Transaction {
  id: string;
  vendor: string;
  date: string;
  amount: number;
  status: string;
  category_id?: string;
  category_suggestion?: string;
  original_amount?: number;
  original_currency?: string;
  exchange_rate?: number;
  is_reimbursable?: boolean;
  client_tag?: string;
  comments?: Comment[];
  has_attachments?: boolean;
}
