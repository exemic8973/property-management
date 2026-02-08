'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@property-os/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Input } from '@property-os/ui';
import { Label } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { Wrench, AlertTriangle, Upload, X } from 'lucide-react';
import { cn } from '@property-os/ui';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
    photos?: string[];
  }) => Promise<void>;
  submitting?: boolean;
  className?: string;
}

export function MaintenanceForm({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
  className,
}: MaintenanceFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'appliances', label: 'Appliances' },
    { value: 'structural', label: 'Structural' },
    { value: 'pest_control', label: 'Pest Control' },
    { value: 'landscaping', label: 'Landscaping' },
    { value: 'security', label: 'Security' },
    { value: 'internet', label: 'Internet/TV' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', icon: null },
    { value: 'medium', label: 'Medium', icon: null },
    { value: 'high', label: 'High', icon: AlertTriangle },
    { value: 'emergency', label: 'Emergency', icon: AlertTriangle },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        photos: photos.length > 0 ? photos : undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      setPhotos([]);
      setErrors({});

      onClose();
    } catch (error) {
      console.error('Failed to submit maintenance request:', error);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Submit Maintenance Request
          </DialogTitle>
          <DialogDescription>
            Describe your maintenance issue in detail so we can help resolve it quickly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title of the issue (e.g., Leaking faucet)"
              disabled={submitting}
              className={cn(errors.title && 'border-red-500')}
            />
            {errors.title && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} disabled={submitting}>
              <SelectTrigger className={cn(errors.category && 'border-red-500')}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.category}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <div className="grid grid-cols-2 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  disabled={submitting}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
                    priority === p.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  {p.icon && <p.icon className={cn('h-4 w-4', p.value === 'emergency' ? 'text-red-500' : '')} />}
                  <span className={cn('font-medium', getPriorityColor(p.value), priority === p.value ? '' : 'bg-gray-100 dark:bg-gray-800')}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about the maintenance issue..."
              disabled={submitting}
              rows={5}
              className={cn(
                'w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none',
                errors.description && 'border-red-500'
              )}
            />
            {errors.description && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label htmlFor="photos">Photos (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={submitting}
                className="hidden"
              />
              <label
                htmlFor="photos"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload photos
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPG up to 10MB each
                </p>
              </label>
            </div>

            {/* Photo Preview */}
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      disabled={submitting}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}