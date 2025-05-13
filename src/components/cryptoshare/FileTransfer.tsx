"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, CheckCircle, XCircle, AlertTriangle, Loader2, Download } from 'lucide-react';

interface FileTransferProps {
  sessionKey: string; // Used for mock E2EE
}

interface MockFile {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'transferring' | 'transferred' | 'rejected' | 'error';
  progress?: number;
  type: 'incoming' | 'outgoing';
}

export function FileTransfer({ sessionKey }: FileTransferProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileSending, setIsFileSending] = useState(false);
  const [mockFiles, setMockFiles] = useState<MockFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Simulate receiving a file
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (sessionKey) {
       // Debounce or limit frequency of this effect if sessionKey changes often
      timeoutId = setTimeout(() => {
        if (Math.random() < 0.3) { // Randomly simulate incoming file
          const mockIncomingFile: MockFile = {
            id: `incoming-${Date.now()}`,
            name: `received_document_${Math.floor(Math.random() * 100)}.pdf`,
            size: Math.floor(Math.random() * 50000000) + 1000000, // 1MB to 50MB
            status: 'pending',
            type: 'incoming',
          };
          setMockFiles(prev => [mockIncomingFile, ...prev].slice(0,5)); // Keep last 5
          toast({
            title: 'Incoming File',
            description: `You have a new file request: ${mockIncomingFile.name}`,
          });
        }
      }, 1000 + Math.random() * 4000); // Add some randomness to timing
    }
    return () => clearTimeout(timeoutId);
  }, [sessionKey, toast]);


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

  const handleSendFile = () => {
    if (!selectedFile) {
      toast({ title: 'No File Selected', description: 'Please select a file to send.', variant: 'destructive' });
      return;
    }
    if (!sessionKey) {
      toast({ title: 'Error', description: 'Session key is missing. Cannot encrypt file.', variant: 'destructive' });
      return;
    }

    setIsFileSending(true);
    const newFile: MockFile = {
      id: `outgoing-${Date.now()}`,
      name: selectedFile.name,
      size: selectedFile.size,
      status: 'transferring',
      progress: 0,
      type: 'outgoing',
    };
    setMockFiles(prev => [newFile, ...prev].slice(0,5));

    // Mock file sending with progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setMockFiles(prev => prev.map(f => f.id === newFile.id ? {...f, progress} : f));
      } else {
        clearInterval(interval);
        setMockFiles(prev => prev.map(f => f.id === newFile.id ? {...f, status: 'transferred', progress: 100} : f));
        setIsFileSending(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast({ title: 'File Sent', description: `${newFile.name} sent successfully (mocked).` });
      }
    }, 200);
  };

  const handleFileAction = (fileId: string, action: 'approve' | 'reject') => {
    setMockFiles(prev => prev.map(f => {
      if (f.id === fileId && f.type === 'incoming' && f.status === 'pending') {
        if (action === 'approve') {
          toast({ title: 'File Approved', description: `${f.name} approved for download (mocked).` });
          // Simulate download
          let progress = 0;
          const interval = setInterval(() => {
            progress += 20;
            if (progress <= 100) {
              setMockFiles(prevFiles => prevFiles.map(pf => pf.id === fileId ? {...pf, progress, status: 'transferring'} : pf));
            } else {
              clearInterval(interval);
              setMockFiles(prevFiles => prevFiles.map(pf => pf.id === fileId ? {...pf, status: 'transferred', progress: 100} : pf));
              toast({ title: 'File Received', description: `${f.name} downloaded successfully (mocked).` });
            }
          }, 150);
          return {...f, status: 'transferring', progress: 0};
        } else {
          toast({ title: 'File Rejected', description: `${f.name} rejected.`, variant: 'destructive' });
          return {...f, status: 'rejected'};
        }
      }
      return f;
    }));
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
            disabled={isFileSending}
            className="file:text-primary file:font-semibold file:bg-primary/10 file:border-none file:rounded-md file:px-3 file:py-1.5 hover:file:bg-primary/20"
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          )}
        </div>
        <Button onClick={handleSendFile} disabled={!selectedFile || isFileSending} className="w-full">
          {isFileSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          Send File
        </Button>

        {mockFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Transfer Activity:</h3>
            {mockFiles.map(file => (
              <Card key={file.id} className="p-4 bg-card/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-card-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} - {file.type === 'incoming' ? 'Incoming' : 'Outgoing'}</p>
                  </div>
                  <div className="text-xs">
                    {file.status === 'pending' && file.type === 'incoming' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {file.status === 'transferring' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                    {file.status === 'transferred' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {file.status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                    {file.status === 'error' && <AlertTriangle className="h-5 w-5 text-red-700" />}
                  </div>
                </div>
                {(file.status === 'transferring' || (file.status === 'transferred' && file.progress === 100) ) && file.progress !== undefined && (
                  <Progress value={file.progress} className="w-full h-2 mt-2" />
                )}
                {file.status === 'pending' && file.type === 'incoming' && (
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" onClick={() => handleFileAction(file.id, 'approve')} className="bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleFileAction(file.id, 'reject')}>Reject</Button>
                  </div>
                )}
                 {file.status === 'transferred' && file.type === 'incoming' && (
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast({title: "Download Mocked", description: `${file.name} download started (mock).`})}>
                    <Download className="mr-2 h-4 w-4" /> Download Again (Mock)
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Files are end-to-end encrypted (mocked using session key).</p>
      </CardFooter>
    </Card>
  );
}
