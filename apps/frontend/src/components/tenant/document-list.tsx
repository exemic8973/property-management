'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { FileText, Download, Search, Filter, FileIcon, FileImage, FileCode, Calendar } from 'lucide-react';
import { cn } from '@property-os/ui';

interface Document {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  description?: string;
  createdAt: Date | string;
}

interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
  onFilterChange: (filters: { type?: string; entityType?: string }) => void;
  className?: string;
}

export function DocumentList({
  documents,
  loading = false,
  onFilterChange,
  className,
}: DocumentListProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const documentTypes = [
    { value: 'lease', label: 'Lease Agreement' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'policy', label: 'Policy Document' },
    { value: 'notice', label: 'Notice' },
    { value: 'other', label: 'Other' },
  ];

  const entityTypes = [
    { value: 'property', label: 'Property' },
    { value: 'unit', label: 'Unit' },
    { value: 'lease', label: 'Lease' },
    { value: 'tenant', label: 'Tenant' },
    { value: 'maintenance_request', label: 'Maintenance Request' },
  ];

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (mimeType.includes('image')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
      return <FileCode className="h-5 w-5 text-gray-500" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateValue: Date | string) => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeLabel = (type: string) => {
    const found = documentTypes.find((t) => t.value === type);
    return found?.label || type;
  };

  const getEntityTypeLabel = (entityType: string) => {
    const found = entityTypes.find((e) => e.value === entityType);
    return found?.label || entityType;
  };

  const handleFilterChange = () => {
    onFilterChange({
      type: typeFilter === 'all' ? undefined : typeFilter,
      entityType: entityTypeFilter === 'all' ? undefined : entityTypeFilter,
    });
  };

  React.useEffect(() => {
    handleFilterChange();
  }, [typeFilter, entityTypeFilter]);

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query)
    );
  });

  const handleDownload = (doc: Document) => {
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <CardTitle>Documents</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map((entity) => (
                  <SelectItem key={entity.value} value={entity.value}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {documents.length === 0 ? 'No documents found' : 'No documents match your search'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                {/* File Icon and Type Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(document.mimeType)}
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {getTypeLabel(document.type)}
                    </span>
                  </div>
                </div>

                {/* File Name */}
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 truncate">
                  {document.fileName}
                </h3>

                {/* Description */}
                {document.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {document.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(document.createdAt)}
                  </span>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>

                {/* Entity Type Badge */}
                <div className="mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Related to: <span className="font-medium text-gray-700 dark:text-gray-300">{getEntityTypeLabel(document.entityType)}</span>
                  </span>
                </div>

                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDownload(document)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}