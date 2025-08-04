import React, { useState } from 'react';
import { Download, Package, Image, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { StreetViewImage, ExportOptions } from '../types';
import { exportImagesAsZip, exportIndividualImages, estimateExportSize, formatFileSize } from '../lib/export-utils';

interface ExportDialogProps {
  images: StreetViewImage[];
  routeName: string;
  onClose: () => void;
  isExporting: boolean;
  onExportStart: () => void;
  onExportComplete: () => void;
}

export function ExportDialog({ 
  images, 
  routeName, 
  onClose, 
  isExporting, 
  onExportStart, 
  onExportComplete 
}: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'zip',
    includeMetadata: true,
    imageQuality: 'high'
  });

  const validImages = images.filter(img => img.loaded && !img.error);
  const estimatedSize = estimateExportSize(validImages);

  const handleExport = async () => {
    if (validImages.length === 0) return;

    onExportStart();

    try {
      if (exportOptions.format === 'zip') {
        await exportImagesAsZip(validImages, exportOptions, routeName);
      } else {
        await exportIndividualImages(validImages, routeName);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      onExportComplete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Street View Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Statistics */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Images:</span>
              <span>{images.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Valid Images:</span>
              <span className="text-green-400">{validImages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Failed Images:</span>
              <span className="text-red-400">{images.length - validImages.length}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Estimated Size:</span>
              <span>{formatFileSize(estimatedSize)}</span>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: 'zip' | 'individual') => 
                setExportOptions({ ...exportOptions, format: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zip">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    ZIP Archive (Recommended)
                  </div>
                </SelectItem>
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Individual Files
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Metadata (ZIP only) */}
          {exportOptions.format === 'zip' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Include Metadata</Label>
              <Select
                value={exportOptions.includeMetadata.toString()}
                onValueChange={(value) => 
                  setExportOptions({ ...exportOptions, includeMetadata: value === 'true' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Yes (Include route info)
                    </div>
                  </SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Warnings */}
          {validImages.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No valid images to export. Please ensure Street View images have loaded successfully.
              </AlertDescription>
            </Alert>
          )}

          {exportOptions.format === 'individual' && validImages.length > 10 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Downloading {validImages.length} individual files may trigger multiple download prompts in your browser.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || validImages.length === 0}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {validImages.length} Images
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}