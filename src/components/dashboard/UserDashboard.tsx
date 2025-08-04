import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  FileText, 
  Download, 
  Trash2, 
  Calendar,
  TrendingUp,
  MapPin,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useUser } from '../../lib/supabase';
import { UserService } from '../../lib/user-service';
import { formatDistance } from '../../lib/utils';
import { CreditPurchaseDialog } from './CreditPurchaseDialog';
import { GPXFile, CreditTransaction } from '../../lib/supabase';

interface UserDashboardProps {
  onClose: () => void;
}

export function UserDashboard({ onClose }: UserDashboardProps) {
  const { user } = useUser();
  const [credits, setCredits] = useState(0);
  const [gpxFiles, setGpxFiles] = useState<GPXFile[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) {
      setCredits(100);
      setGpxFiles([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Ensure user profile exists
      await UserService.createOrUpdateProfile(user.id, user.email || '');
      
      // Load data in parallel
      const [creditBalance, files, recentTransactions] = await Promise.all([
        UserService.getCreditBalance(user.id),
        UserService.getGPXFiles(user.id),
        UserService.getCreditTransactions(user.id)
      ]);
      
      setCredits(creditBalance);
      setGpxFiles(files);
      setTransactions(recentTransactions);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set defaults on error
      setCredits(100);
      setGpxFiles([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGPX = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this GPX file?')) return;
    
    try {
      if (user) {
        await UserService.deleteGPXFile(user.id, fileId);
      }
      setGpxFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Failed to delete GPX file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handlePurchaseComplete = () => {
    setShowPurchaseDialog(false);
    loadDashboardData(); // Refresh data after purchase
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-background rounded-lg border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome back, {user?.email || 'User'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4" />
                  Available Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{credits.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{Math.floor(credits / 200)} typical race routes
                </p>
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setShowPurchaseDialog(true)}
                >
                  Buy More Credits
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Saved Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gpxFiles.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {10 - gpxFiles.length} slots remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Total Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gpxFiles.reduce((sum, file) => sum + file.processed_images_count, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Street View images processed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* GPX Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Your Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gpxFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No routes saved yet</p>
                  <p className="text-sm">Upload a GPX file to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gpxFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{file.route_name || file.original_filename}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {file.processed_images_count} images
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{formatDistance(file.total_distance || 0)}</span>
                          <span>{file.total_points} points</span>
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteGPX(file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                        </div>
                        <Badge variant={transaction.type === 'purchase' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Purchase Dialog */}
      {showPurchaseDialog && (
        <CreditPurchaseDialog
          onClose={() => setShowPurchaseDialog(false)}
          onPurchaseComplete={handlePurchaseComplete}
          currentCredits={credits}
        />
      )}
    </div>
  );
}