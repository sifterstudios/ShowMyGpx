import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, ArrowRight, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { STRIPE_PRODUCTS, formatPrice, getProductByPriceId } from '../stripe-config';
import { getUserOrders } from '../lib/stripe';

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      loadOrderDetails();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const loadOrderDetails = async () => {
    try {
      const orders = await getUserOrders();
      // Find the most recent order (should be the one we just completed)
      const recentOrder = orders[0];
      setOrderDetails(recentOrder);
    } catch (error) {
      console.error('Failed to load order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductDetails = () => {
    if (!orderDetails) return null;
    
    // Try to match by amount since we don't have price_id in orders table
    const product = STRIPE_PRODUCTS.find(p => p.price === orderDetails.amount_total);
    return product;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your purchase details...</p>
        </div>
      </div>
    );
  }

  const product = getProductDetails();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your credits have been added to your account.
          </p>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderDetails && product ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatPrice(orderDetails.amount_total)}</div>
                    <Badge variant="secondary">{product.credits.toLocaleString()} credits</Badge>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono">{orderDetails.checkout_session_id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant="default">Paid</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date(orderDetails.order_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Your purchase was successful! Credits have been added to your account.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-1 bg-primary/10 rounded">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Upload GPX Files</h4>
                  <p className="text-sm text-muted-foreground">
                    Start exploring your routes with Street View
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-1 bg-primary/10 rounded">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Check Your Credits</h4>
                  <p className="text-sm text-muted-foreground">
                    View your balance in the dashboard
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('/')} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            View Purchase History
          </Button>
        </div>

        {/* Support */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact our support team or check the{' '}
            <a href="#" className="text-primary hover:underline">
              documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}