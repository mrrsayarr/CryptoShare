
export type PeerConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed' | 'closed';

export interface SignalingMessage {
  senderId: string;
  type: 'offer' | 'answer' | 'candidate' | 'ready' | 'disconnect';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit |  Record<string, unknown> | null;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type?: string; // MIME type
  fromPeer: boolean; // Added to distinguish in UI
}

export interface FileChunk {
  fileId: string;
  chunkNumber: number;
  totalChunks: number;
  data: string | ArrayBuffer; // string for base64, ArrayBuffer for binary
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
    id: string;
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
  file?: File; // For outgoing files
  fromPeer?: boolean; // For incoming files
  chunks?: ArrayBuffer[]; // For reassembling incoming files
  receivedChunks?: number; // For reassembling incoming files
  totalChunks?: number; // For reassembling incoming files
}
