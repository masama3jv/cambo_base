import React, { useState, useRef } from 'react';
import { Upload, FileCheck, AlertCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface DocumentUploadZoneProps {
  userId: number;
  teamId: number;
  documentType: 'dni' | 'asseguranca' | 'image_rights';
  onUploadSuccess?: () => void;
  currentFile?: string;
}

export default function DocumentUploadZone({
  userId,
  teamId,
  documentType,
  onUploadSuccess,
  currentFile
}: DocumentUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypeLabels = {
    dni: 'DNI / Carnet d\'identitat',
    asseguranca: 'Assegurança mèdica',
    image_rights: 'Dret d\'imatge'
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setSuccess(false);

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten PDF, JPG o PNG');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar 5MB');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamId', teamId.toString());
      formData.append('userId', userId.toString());
      formData.append('documentType', documentType);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/team/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error uploading file');
      }

      setSuccess(true);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
      setSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <label className="text-sm font-medium text-gray-700 block mb-2">
        {documentTypeLabels[documentType]}
      </label>

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50 hover:bg-blue-50"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600">Pujant arxiu...</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-2">
            <FileCheck className="w-8 h-8 text-green-500" />
            <p className="text-sm text-green-600">Archivo subido correctamente</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              Arrastra aquí o <span className="text-blue-500 font-medium">selecciona un archivo</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG o PNG (máximo 5MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {currentFile && !isUploading && (
        <div className="mt-2 text-xs text-gray-500">
          Archivo actual: {currentFile}
        </div>
      )}
    </div>
  );
}
