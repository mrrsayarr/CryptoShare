
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, CheckCircle, XCircle, AlertTriangle, Loader2, Download, Hourglass } from 'lucide-react';
import type { TransferActivityFile } from '@/types/cryptoshare';

interface FileTransferProps {
  onSendFile: (file: File) => void;
  fileActivities: TransferActivityFile[];
  onFileAction: (fileId: string, approved: boolean) => void; // For approve/reject incoming file
}

export function FileTransfer({ onSendFile, fileActivities, onFileAction }: FileTransferProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileSendingUI, setIsFileSendingUI] = useState(false); // UI state for send button
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        toast({
          title: 'File Too Large',
          description: 'Maximum file size is 500MB.',
          variant: 'destructive',
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSendFileClick = () => {
    if (!selectedFile) {
      toast({ title: 'No File Selected', description: 'Please select a file to send.', variant: 'destructive' });
      return;
    }
    setIsFileSendingUI(true);
    onSendFile(selectedFile); 
    // Actual sending and progress will be managed by parent via webRTC hook.
    // UI can reflect "waiting for approval" or "sending metadata".
    // For now, just clear selection and reset UI button state after a delay.
    toast({ title: "Sending File Request", description: `Requesting to send ${selectedFile.name}. Waiting for peer approval.` });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setIsFileSendingUI(false), 1000); // Reset UI button state
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><UploadCloud className="mr-2 h-6 w-6 text-primary" /> Secure File Transfer</CardTitle>
        <CardDescription>Select a file (up to 500MB) to send securely.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isFileSendingUI} // Only disable UI part, actual send is async
            className="file:text-primary file:font-semibold file:bg-primary/10 file:border-none file:rounded-md file:px-3 file:py-1.5 hover:file:bg-primary/20"
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          )}
        </div>
        <Button onClick={handleSendFileClick} disabled={!selectedFile || isFileSendingUI} className="w-full">
          {isFileSendingUI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          Send File
        </Button>

        {fileActivities.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Transfer Activity:</h3>
            {fileActivities.map(file => (
              <Card key={file.id} className="p-4 bg-card/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-card-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} - {file.type === 'incoming' ? 'Incoming' : 'Outgoing'}</p>
                  </div>
                  <div className="text-xs">
                    {file.status === 'pending_approval' && file.type === 'incoming' && <AlertTriangle className="h-5 w-5 text-yellow-500" title="Pending your approval" />}
                    {file.status === 'waiting_approval' && file.type === 'outgoing' && <Hourglass className="h-5 w-5 text-yellow-500" title="Waiting for peer approval" />}
                    {file.status === 'transferring' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" title="Transferring" />}
                    {file.status === 'transferred' && <CheckCircle className="h-5 w-5 text-green-500" title="Transferred" />}
                    {file.status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" title="Rejected" />}
                    {file.status === 'error' && <AlertTriangle className="h-5 w-5 text-red-700" title="Error" />}
                  </div>
                </div>
                {(file.status === 'transferring' || (file.status === 'transferred' && file.progress === 100) ) && file.progress !== undefined && (
                  <Progress value={file.progress} className="w-full h-2 mt-2" />
                )}
                {file.status === 'pending_approval' && file.type === 'incoming' && (
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" onClick={() => onFileAction(file.id, true)} className="bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => onFileAction(file.id, false)}>Reject</Button>
                  </div>
                )}
                 {file.status === 'transferred' && file.type === 'incoming' && (
                  <Button size="sm" variant="outline" className="mt-3 w-full" 
                    onClick={() => toast({title: "File Ready", description: `${file.name} has been downloaded.`})}>
                    <Download className="mr-2 h-4 w-4" /> Downloaded (Check Downloads Folder)
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Files are end-to-end encrypted via WebRTC.</p>
      </CardFooter>
    </Card>
  );
}
