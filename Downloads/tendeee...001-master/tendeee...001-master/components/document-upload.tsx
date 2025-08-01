"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  File,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Download,
  AlertCircle,
  FileText,
  Image,
  Loader2
} from "lucide-react"

interface DocumentUploadProps {
  documentType: 'gstCertificate' | 'panCard' | 'incorporationCertificate' | 'bankStatement' | 'auditedFinancials'
  label: string
  description: string
  acceptedFormats: string[]
  maxSize: number // in MB
  currentDocument?: string
  onUploadComplete: (documentUrl: string) => void
  onRemove: () => void
}

interface UploadProgress {
  progress: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  message: string
}

export function DocumentUpload({
  documentType,
  label,
  description,
  acceptedFormats,
  maxSize,
  currentDocument,
  onUploadComplete,
  onRemove
}: DocumentUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a file with one of these formats: ${acceptedFormats.join(', ')}`,
        variant: "destructive"
      })
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive"
      })
      return
    }

    // Start upload process
    setUploadProgress({
      progress: 0,
      status: 'uploading',
      message: 'Uploading document...'
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev || prev.progress >= 90) return prev
          return {
            ...prev,
            progress: prev.progress + 10
          }
        })
      }, 200)

      const response = await fetch('/api/user/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      })

      clearInterval(uploadInterval)

      if (response.ok) {
        const result = await response.json()
        
        setUploadProgress({
          progress: 100,
          status: 'processing',
          message: 'Processing document...'
        })

        // Simulate processing time
        setTimeout(() => {
          setUploadProgress({
            progress: 100,
            status: 'complete',
            message: 'Document uploaded successfully'
          })
          
          onUploadComplete(result.documentUrl)
          
          setTimeout(() => {
            setUploadProgress(null)
          }, 2000)
        }, 1500)

        toast({
          title: "Upload Successful",
          description: "Document has been uploaded and is being processed",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }
    } catch (error) {
      setUploadProgress({
        progress: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      })
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: "destructive"
      })

      setTimeout(() => {
        setUploadProgress(null)
      }, 3000)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-8 w-8 text-blue-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const getStatusIcon = () => {
    if (!uploadProgress) return null
    
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {currentDocument && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Uploaded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentDocument ? (
          // Show uploaded document
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(currentDocument)}
                <div>
                  <p className="font-medium">{currentDocument.split('/').pop()}</p>
                  <p className="text-sm text-muted-foreground">Document uploaded</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(currentDocument, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = currentDocument
                    link.download = currentDocument.split('/').pop() || 'document'
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onRemove}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Show upload area
          <div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Upload Document</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={!!uploadProgress}
              >
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={acceptedFormats.map(format => `.${format}`).join(',')}
                onChange={handleFileInput}
              />
            </div>

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon()}
                    <span className="text-sm font-medium">{uploadProgress.message}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {uploadProgress.progress}%
                  </span>
                </div>
                <Progress value={uploadProgress.progress} className="w-full" />
              </div>
            )}

            {/* File Requirements */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">File Requirements:</p>
                  <ul className="space-y-1">
                    <li>• Accepted formats: {acceptedFormats.join(', ').toUpperCase()}</li>
                    <li>• Maximum size: {maxSize}MB</li>
                    <li>• Document should be clear and readable</li>
                    <li>• Ensure all details are visible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Document Upload Manager Component
interface DocumentUploadManagerProps {
  documents: Record<string, string>
  onDocumentUpdate: (documentType: string, documentUrl: string | null) => void
}

export function DocumentUploadManager({ documents, onDocumentUpdate }: DocumentUploadManagerProps) {
  const documentTypes = [
    {
      type: 'gstCertificate' as const,
      label: 'GST Certificate',
      description: 'Upload your GST registration certificate',
      acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxSize: 5
    },
    {
      type: 'panCard' as const,
      label: 'PAN Card',
      description: 'Upload company PAN card copy',
      acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxSize: 2
    },
    {
      type: 'incorporationCertificate' as const,
      label: 'Certificate of Incorporation',
      description: 'Upload certificate of incorporation',
      acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxSize: 5
    },
    {
      type: 'bankStatement' as const,
      label: 'Bank Statement',
      description: 'Upload recent bank statement (last 3 months)',
      acceptedFormats: ['pdf'],
      maxSize: 10
    },
    {
      type: 'auditedFinancials' as const,
      label: 'Audited Financial Statements',
      description: 'Upload latest audited financial statements',
      acceptedFormats: ['pdf'],
      maxSize: 15
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {documentTypes.map((docType) => (
          <DocumentUpload
            key={docType.type}
            documentType={docType.type}
            label={docType.label}
            description={docType.description}
            acceptedFormats={docType.acceptedFormats}
            maxSize={docType.maxSize}
            currentDocument={documents[docType.type]}
            onUploadComplete={(url) => onDocumentUpdate(docType.type, url)}
            onRemove={() => onDocumentUpdate(docType.type, null)}
          />
        ))}
      </div>
    </div>
  )
}