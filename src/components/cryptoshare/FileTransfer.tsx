
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, CheckCircle, XCircle, AlertTriangle, Loader2, Download, Hourglass, FileText, ArrowUpCircle, ArrowDownCircle, Send } from 'lucide-react';
import type { TransferActivityFile } from '@/types/cryptoshare';

interface FileTransferProps {
  onSendFile: (file: File) => void;
  fileActivities: TransferActivityFile[];
  onFileAction: (fileId: string, approved: boolean) => void;
}

export function FileTransfer({ onSendFile, fileActivities, onFileAction }: FileTransferProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileSendingUI, setIsFileSendingUI] = useState(false);
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
    toast({ title: "Sending File Request", description: `Requesting to send ${selectedFile.name}. Waiting for peer approval.` });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setIsFileSendingUI(false), 1000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: TransferActivityFile['status'], type: TransferActivityFile['type']) => {
    switch (status) {
      case 'pending_approval': return <AlertTriangle className="h-5 w-5 text-yellow-500" title="Pending your approval" />;
      case 'waiting_approval': return <Hourglass className="h-5 w-5 text-yellow-500" title="Waiting for peer approval" />;
      case 'transferring': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" title="Transferring" />;
      case 'transferred': return <CheckCircle className="h-5 w-5 text-green-500" title="Transferred" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" title="Rejected" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-700" title="Error" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getTransferDirectionIcon = (type: TransferActivityFile['type']) => {
    return type === 'incoming' 
      ? <ArrowDownCircle className="h-5 w-5 text-blue-500" title="Incoming" />
      : <ArrowUpCircle className="h-5 w-5 text-green-500" title="Outgoing" />;
  }

  return (
    <Card className="shadow-xl border-border/60">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="flex items-center text-xl font-semibold"><UploadCloud className="mr-3 h-7 w-7 text-primary" /> Secure File Transfer</CardTitle>
        <CardDescription className="text-sm text-muted-foreground pt-1">Select a file (up to 500MB) to send securely to your peer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="p-4 border border-dashed border-border rounded-lg bg-background hover:border-primary/70 transition-colors">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isFileSendingUI}
              className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
            <Button onClick={handleSendFileClick} disabled={!selectedFile || isFileSendingUI} className="w-full sm:w-auto px-6 py-2.5 text-base" size="lg">
              {isFileSendingUI ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Send File
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-3 text-center sm:text-left">
              Selected: <span className="font-medium text-foreground">{selectedFile.name}</span> ({formatFileSize(selectedFile.size)})
            </p>
          )}
        </div>

        {fileActivities.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="font-semibold text-lg text-foreground border-b border-border pb-2 mb-3">Transfer Activity</h3>
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 -mr-2">
              {fileActivities.map(file => (
                <Card key={file.id} className={`p-4 shadow-md transition-all hover:shadow-lg ${file.type === 'incoming' ? 'bg-secondary/50 border-blue-500/30' : 'bg-card border-green-500/30'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                       {getTransferDirectionIcon(file.type)}
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-card-foreground truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        <span className="text-xs text-muted-foreground capitalize">{file.status.replace('_', ' ')}</span>
                        {getStatusIcon(file.status, file.type)}
                    </div>
                  </div>
                  
                  {(file.status === 'transferring' || (file.status === 'transferred' && file.progress === 100) ) && file.progress !== undefined && (
                    <div className="mt-3">
                      <Progress value={file.progress} className="w-full h-2.5" />
                      <p className="text-xs text-right text-muted-foreground mt-1">{file.progress}%</p>
                    </div>
                  )}

                  {file.status === 'pending_approval' && file.type === 'incoming' && (
                    <div className="flex space-x-3 mt-3 pt-3 border-t border-border/50">
                      <Button size="sm" onClick={() => onFileAction(file.id, true)} className="bg-green-600 hover:bg-green-700 text-white flex-grow">
                        <CheckCircle className="mr-2 h-4 w-4"/>Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onFileAction(file.id, false)} className="flex-grow">
                        <XCircle className="mr-2 h-4 w-4"/>Reject
                      </Button>
                    </div>
                  )}
                  {file.status === 'transferred' && file.type === 'incoming' && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-500 flex items-center">
                      <Download className="mr-1.5 h-4 w-4" /> File automatically downloaded.
                    </div>
                  )}
                   {file.status === 'transferred' && file.type === 'outgoing' && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-500 flex items-center">
                      <CheckCircle className="mr-1.5 h-4 w-4" /> File successfully sent.
                    </div>
                  )}
                  {file.status === 'rejected' && (
                     <p className="mt-2 text-xs text-red-600 dark:text-red-500">
                        {file.type === 'incoming' ? 'You rejected this file.' : 'Peer rejected this file.'}
                     </p>
                  )}
                   {file.status === 'error' && (
                     <p className="mt-2 text-xs text-red-700 dark:text-red-600">
                        Transfer error. Please try again or check connection.
                     </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-border/50 pt-4">
        <p className="text-xs text-muted-foreground text-center w-full">Files are end-to-end encrypted via WebRTC. Max file size: 500MB.</p>
      </CardFooter>
    </Card>
  );
}
