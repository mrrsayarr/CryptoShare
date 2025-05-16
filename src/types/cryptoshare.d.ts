
export type PeerConnectionState =
  | 'disconnected'       // Initial state, no connection or connection closed/failed and reset.
  | 'creating_session'   // Initiator: Generating session key and offer.
  | 'waiting_for_peer'   // Initiator: Offer sent (e.g., to Supabase), session key displayed, waiting for guest.
  | 'joining_session'    // Guest: Trying to join with a session key, fetching offer.
  | 'connecting'         // Both: SDPs exchanged, ICE negotiation in progress.
  | 'connected'          // P2P connection and data channel active.
  | 'failed';            // Connection attempt failed.

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
  data: string | ArrayBuffer; // data is base64 encoded string when sent over data channel
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
  file?: File; // For outgoing files before sending
  fromPeer?: boolean; // Should ideally be part of 'type' or redundant
  blob?: Blob; // For incoming files after assembly, to allow re-download
  // Obsolete fields, kept for reference to previous structure if needed:
  // chunks?: ArrayBuffer[];
  // receivedChunks?: number;
  // totalChunks?: number;
}

// Supabase specific types
export interface WebRTCSession {
  id: string; // Session Key
  offer_sdp?: RTCSessionDescriptionInit;
  answer_sdp?: RTCSessionDescriptionInit;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseIceCandidatePayload {
  type: 'ICE_CANDIDATE';
  candidate: RTCIceCandidateInit;
  from: 'initiator' | 'guest';
}

export interface SupabaseAnswerPayload {
  type: 'ANSWER';
  sdp: RTCSessionDescriptionInit;
}
