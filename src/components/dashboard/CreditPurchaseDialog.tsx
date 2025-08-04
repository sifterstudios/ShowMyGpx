import React, { useState } from 'react';
import { CreditCard, Check, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { STRIPE_PRODUCTS, formatPrice } from '../../stripe-config';
import { createCheckoutSession, stripePromise } from '../../lib/stripe';
import { useUser } from './../../lib/supabase';

interface CreditPurchaseDialogProps {
  onClose: () => void;
  onPurchaseComplete: () => void;
  currentCredits: number;
}

export function CreditPurchaseDialog({ 
  onClose, 
  onPurchaseComplete, 
  currentCredits 
}: CreditPurchaseDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState(STRIPE_PRODUCTS[1]); // Default to Race Pack
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      // Create checkout session using our edge function
      const sessionId = await createCheckoutSession(selectedPackage.priceId, selectedPackage.mode);
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe error:', error);
          throw new Error('Payment failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      // You could show a toast or error message here instead of alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Purchase Credits
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            You currently have {currentCredits.toLocaleString()} credits
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Package Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STRIPE_PRODUCTS.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPackage.id === pkg.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedPackage(pkg)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                
                <div className="text-center space-y-2">
                  <h3 className="font-semibold">{pkg.name}</h3>
                  <div className="text-2xl font-bold">{formatPrice(pkg.price)}</div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.credits.toLocaleString()} credits
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${(pkg.price / pkg.credits * 100).toFixed(3)} per credit
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-xs font-medium">{pkg.description}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {pkg.examples.slice(0, 2).map((example, index) => (
                      <div key={index} className="flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{example}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPackage.id === pkg.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Selected Package Details */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Selected: {selectedPackage.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPackage.credits.toLocaleString()} credits for {formatPrice(selectedPackage.price)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">After purchase:</div>
                  <div className="font-semibold">
                    {(currentCredits + selectedPackage.credits).toLocaleString()} total credits
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Usage Examples */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3">What can you do with these credits?</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {selectedPackage.examples.map((example, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{example}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase {formatPrice(selectedPackage.price)}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}