
# Cryptoshare - Secure P2P Transfer

Cryptoshare is a peer-to-peer (P2P) application designed for secure transfer of files, data snippets, and messages directly between users' browsers. It utilizes WebRTC for direct P2P communication and Supabase for the initial signaling (connection setup) process. All transfers are end-to-end encrypted through the WebRTC data channel (DTLS).

## Key Features

*   **Peer-to-Peer (P2P) Communication**: Direct connection between users using WebRTC, minimizing server involvement for data transfer.
*   **End-to-End Encryption**: All files, data, and messages are encrypted in transit using DTLS, inherent to WebRTC data channels.
*   **File Transfer**: Securely send and receive files (up to 500MB) with a peer approval mechanism.
*   **Data Snippet Transfer**: Quickly send short text or JSON data.
*   **Real-time Messaging**: Chat securely with your connected peer.
*   **Supabase for Signaling**: Uses Supabase Realtime Database and Broadcast for exchanging connection metadata (offers, answers, ICE candidates) to establish the P2P link.
*   **Simple Connection Flow**: Initiate a session to get a unique key, share it with your peer, and they can join your session easily.
*   **Light & Dark Mode**: Theme support for user preference.

## Tech Stack

*   **Frontend**: Next.js (App Router), React, TypeScript
*   **UI**: ShadCN UI Components, Tailwind CSS
*   **Signaling**: Supabase (Realtime Database for session initiation, Realtime Broadcast for SDP/ICE exchange)
*   **P2P Communication**: WebRTC (RTCPeerConnection, RTCDataChannel)

## Setup and Installation

Follow these steps to set up and run Cryptoshare locally:

**1. Clone the Repository:**

```bash
git clone <repository_url>
cd cryptoshare
```

**2. Install Dependencies:**

Using npm:
```bash
npm install
```
Or using yarn:
```bash
yarn install
```

**3. Supabase Setup:**

Cryptoshare requires a Supabase project for its signaling mechanism.

   *   **Create a Supabase Project**: If you don't have one, go to [supabase.com](https://supabase.com) and create a new project.
   *   **Create `webrtc_sessions` Table**:
      Navigate to the "SQL Editor" in your Supabase project dashboard and run the following SQL query to create the necessary table:
      ```sql
      CREATE TABLE public.webrtc_sessions (
        id TEXT PRIMARY KEY, -- This will be the session_key
        offer_sdp JSONB,
        answer_sdp JSONB,
        status TEXT,         -- e.g., 'waiting_for_guest', 'guest_joined', 'connected'
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ```
   *   **Configure Row Level Security (RLS)**:
      RLS is likely enabled by default. You need to create policies to allow the application (using the `anon` key) to interact with this table.
      In the SQL Editor, run:
      ```sql
      -- Enable RLS if not already enabled (usually is by default for new tables)
      -- ALTER TABLE public.webrtc_sessions ENABLE ROW LEVEL SECURITY;

      -- Allow anonymous users to read sessions (e.g., to fetch an offer)
      CREATE POLICY "Allow public read access to webrtc_sessions"
      ON public.webrtc_sessions
      FOR SELECT
      TO anon
      USING (true);

      -- Allow anonymous users to create new sessions (insert offers)
      CREATE POLICY "Allow public insert access to webrtc_sessions"
      ON public.webrtc_sessions
      FOR INSERT
      TO anon
      WITH CHECK (true);

      -- Allow anonymous users to update sessions (e.g., for guest to add an answer or initiator to update status)
      -- For production, you might want to make this more restrictive (e.g., only allow specific fields to be updated by specific roles or based on auth.uid())
      CREATE POLICY "Allow public update access to webrtc_sessions"
      ON public.webrtc_sessions
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true);
      ```
      **Note**: These are permissive policies for ease of setup. For a production environment, you should define more restrictive RLS policies based on your security requirements.
   *   **Enable Realtime for the Table**:
      Go to "Database" -> "Replication" in your Supabase dashboard. Ensure that `public.webrtc_sessions` is listed and enabled for Realtime. This is crucial for broadcasting answers and ICE candidates.

**4. Environment Variables:**

   *   Create a `.env` file in the root of your project.
   *   Add your Supabase project URL and Anon Key to this file:
      ```env
      NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL_HERE"
      NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"
      ```
      Replace `YOUR_SUPABASE_URL_HERE` and `YOUR_SUPABASE_ANON_KEY_HERE` with your actual credentials from your Supabase project settings (Project Settings -> API).

**5. Run the Application:**

```bash
npm run dev
```
Or using yarn:
```bash
yarn dev
```
The application should now be running, typically on `http://localhost:9002`.

## How to Use Cryptoshare

The connection process is facilitated by Supabase for exchanging initial connection details (Offer/Answer SDPs and ICE candidates).

**1. Establishing a Secure Connection:**

   *   **Initiator (User A)**:
      1.  Opens Cryptoshare.
      2.  Clicks the "Create New Session" button.
      3.  The application generates a unique "Session Key". This key is displayed on the screen.
      4.  The Initiator securely shares this Session Key with the Guest (User B) (e.g., via a secure messaging app, email).

   *   **Guest (User B)**:
      1.  Opens Cryptoshare.
      2.  Enters the Session Key received from User A into the "Enter Session Key" input field.
      3.  Clicks the "Join Session" button.

   *   **Automatic Connection**:
      If the Session Key is correct and both users are online, Supabase will facilitate the exchange of necessary WebRTC connection information (Offer, Answer, and ICE candidates) in the background. The connection status will update, and once "Securely Connected!" is shown, the P2P link is established.

**2. Using the Features (Once Connected):**

   *   **File Transfer Tab**:
      *   **Sending**: Click "Choose File", select the file (up to 500MB), and click "Send File". Your peer will receive a request to approve the transfer. Once they approve, the file will be sent directly.
      *   **Receiving**: When your peer initiates a file transfer, it will appear in your "Transfer Activity" list with "Approve" and "Reject" buttons. Click "Approve" to start receiving the file directly from your peer. The file will be automatically downloaded once completed.

   *   **Data Transfer Tab**:
      *   Enter any short text or JSON data into the textarea.
      *   Click "Send Data". The data will be sent directly to your peer and appear in their "Data Log". Your sent data will also appear in your log.

   *   **Messaging Tab**:
      *   Type your message in the input field at the bottom of the chat window.
      *   Press Enter or click the send button. Your message is sent directly to your peer and appears in their chat window and yours.

**3. Disconnecting:**

   *   Either user can click the "Disconnect Session" button (or "Reset and Try Again" if the connection failed). This will close the P2P connection.
   *   Refreshing the page or closing the browser tab will also terminate the connection.

## Security Notes

*   **End-to-End Encryption**: All data transferred directly between peers (files, data snippets, messages) is encrypted end-to-end using DTLS (Datagram Transport Layer Security), which is a standard part of WebRTC.
*   **Signaling Server (Supabase)**: Supabase is used *only* for the signaling process – that is, to help the two browsers find each other and exchange the initial metadata needed to establish the direct P2P connection. Your actual files, messages, and data snippets **do not** pass through Supabase servers during transfer once the P2P connection is active.
*   **Session Key Security**: The security of the Session Key exchange is the responsibility of the users. Share it through a trusted channel. Once the key is used and the P2P connection is established, the key itself is no longer directly involved in the data transfer encryption.

## Connectivity (STUN/TURN Servers)

*   **STUN Servers**: Cryptoshare uses public STUN servers (e.g., `stun:stun.l.google.com:19302`) to help browsers discover their public IP addresses and attempt to establish direct P2P connections.
*   **NAT Traversal**: In many cases, STUN is sufficient. However, some network configurations (like complex NATs or restrictive firewalls) can prevent direct P2P connections.
*   **TURN Servers**: If you experience persistent connection failures (e.g., status stuck on "Connecting" or "Failed", or ICE connection failures in the browser console), it might be due to your network environment. In such cases, a TURN server is required to relay the encrypted WebRTC traffic. Cryptoshare is configured to use TURN servers if provided in its `ICE_SERVERS` configuration (in `src/hooks/useWebRTC.ts`), but it **does not provide a TURN server service itself**. For reliable connections across all network types, using a publicly available or self-hosted TURN server with proper credentials might be necessary.
