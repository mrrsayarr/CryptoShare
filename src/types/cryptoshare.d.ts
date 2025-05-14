
export type PeerConnectionState = 
  | 'disconnected'       // Başlangıç durumu, bağlantı yok veya kesildi/başarısız oldu ve sıfırlandı.
  | 'offer_generated'    // Başlatıcı: Teklif (Offer SDP) paylaşıma hazır.
  | 'answer_generated'   // Misafir: Yanıt (Answer SDP) paylaşıma hazır.
  | 'connecting'         // Aktif olarak bağlantı kurulmaya çalışılıyor (SDP'ler değiş tokuş edildi, ICE adayları işleniyor).
  | 'connected'          // P2P bağlantısı ve veri kanalı aktif.
  | 'failed';            // Bağlantı kurma denemesi başarısız oldu.

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type?: string; // MIME type
  fromPeer: boolean; 
}

export interface FileChunk {
  fileId: string;
  chunkNumber: number;
  totalChunks: number;
  data: string | ArrayBuffer; 
  isLast: boolean;
}

export interface FileApproveReject {
    fileId: string;
    approved: boolean;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'peer';
    timestamp: Date;
}

export interface DataSnippet {
    id:string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
}

export interface TransferActivityFile {
  id: string;
  name: string;
  size: number;
  status: 'pending_approval' | 'transferring' | 'transferred' | 'rejected' | 'error' | 'pending_send' | 'waiting_approval';
  progress?: number;
  type: 'incoming' | 'outgoing';
  file?: File; 
  fromPeer?: boolean; 
  chunks?: ArrayBuffer[]; 
  receivedChunks?: number; 
  totalChunks?: number; 
}
