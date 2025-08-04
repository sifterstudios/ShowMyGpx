import React from 'react';
import { Loader2, MapPin, Image, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { ProcessingProgress as ProcessingProgressType } from '../types';

interface ProcessingProgressProps {
  progress: ProcessingProgressType;
}

export function ProcessingProgress({ progress }: ProcessingProgressProps) {
  const getIcon = () => {
    switch (progress.stage) {
      case 'parsing':
        return <MapPin className="h-5 w-5" />;
      case 'generating':
        return <Image className="h-5 w-5" />;
      case 'loading':
        return <Download className="h-5 w-5" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getStageTitle = () => {
    switch (progress.stage) {
      case 'parsing':
        return 'Parsing GPX File';
      case 'generating':
        return 'Generating Street View URLs';
      case 'loading':
        return 'Loading Street View Images';
      case 'complete':
        return 'Processing Complete';
      default:
        return 'Processing';
    }
  };

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          {getStageTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progress.message}</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>
        
        {progress.stage === 'loading' && (
          <div className="text-xs text-muted-foreground text-center">
            <p>Loading Street View images may take a few moments...</p>
            <p>Images are being fetched from Google's servers</p>
          </div>
        )}
        
        {progress.stage === 'generating' && (
          <div className="text-xs text-muted-foreground text-center">
            <p>Creating Street View URLs for your route...</p>
            <p>This process samples points along your track</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}