import { supabase, UserProfile, GPXFile, CreditTransaction } from './supabase';
import { useUser } from './supabase';
import React from 'react';

/**
 * User service for managing user profiles, credits, and GPX files
 */
export class UserService {
  /**
   * Create or update user profile when they sign in
   */
  static async createOrUpdateProfile(userId: string, email: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          clerk_user_id: userId,
          email: email,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'clerk_user_id'
        })
        .select()
        .single();

    if (error) {
      console.error('Profile upsert error:', error);
      throw new Error(`Failed to create/update profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user profile by Clerk user ID
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's credit balance
   */
  static async getCreditBalance(userId: string): Promise<number> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) return 100; // Default credits for new users
      return profile.credits || 100;
    } catch (error) {
      console.error('Error getting credit balance:', error);
      return 100; // Default fallback
    }
  }

  /**
   * Deduct credits for Street View API usage
   */
  static async deductCredits(
    userId: string,
    creditsToDeduct: number,
    description: string,
    gpxFileId?: string
  ): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) throw new Error('User profile not found');

      const newBalance = profile.credits - creditsToDeduct;
      if (newBalance < 0) return false;

      // Update credits
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ credits: newBalance })
        .eq('clerk_user_id', userId);

      if (updateError) throw updateError;

      // Record transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: profile.id,
          type: 'usage',
          amount: -creditsToDeduct,
          description
        });

      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
  }

  /**
   * Add credits from purchase
   */
  static async addCredits(
    userId: string,
    creditsToAdd: number,
    description: string,
    stripePaymentIntentId?: string
  ): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile) throw new Error('User profile not found');

      const newBalance = profile.credits + creditsToAdd;

      // Update credits
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          credits: newBalance,
          total_credits_purchased: profile.total_credits_purchased + creditsToAdd
        })
        .eq('clerk_user_id', userId);

      if (updateError) throw updateError;

      // Record transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: profile.id,
          type: 'purchase',
          amount: creditsToAdd,
          description,
          stripe_payment_intent_id: stripePaymentIntentId
        });

      return true;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  }

  /**
   * Get user's GPX files
   */
  static async getGPXFiles(userId: string): Promise<GPXFile[]> {
    // First get the user profile to get the user_id
    const profile = await this.getProfile(userId);
    if (!profile) return [];

    const { data, error } = await supabase
      .from('gpx_files')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting GPX files:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Save GPX file metadata
   */
  static async saveGPXFile(
    userId: string,
    filename: string,
    originalFilename: string,
    fileSize: number,
    storagePath: string,
    routeName?: string,
    totalDistance?: number,
    totalPoints?: number
  ): Promise<GPXFile> {
    // First get the user profile to get the user_id
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const { data, error } = await supabase
      .from('gpx_files')
      .insert({
        user_id: profile.id,
        filename,
        original_filename: originalFilename,
        file_size: fileSize,
        storage_path: storagePath,
        route_name: routeName,
        total_distance: totalDistance,
        total_points: totalPoints
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save GPX file: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete GPX file
   */
  static async deleteGPXFile(userId: string, gpxFileId: string): Promise<void> {
    // First get the user profile to get the user_id
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Get the file info first to delete from storage
    const { data: fileData, error: fileError } = await supabase
      .from('gpx_files')
      .select('storage_path')
      .eq('id', gpxFileId)
      .eq('user_id', profile.id)
      .single();

    if (fileError) {
      throw new Error(`Failed to get file info: ${fileError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('gpx-files')
      .remove([fileData.storage_path]);

    if (storageError) {
      console.warn('Failed to delete file from storage:', storageError);
    }

    // Delete from database
    const { error } = await supabase
      .from('gpx_files')
      .delete()
      .eq('id', gpxFileId)
      .eq('user_id', profile.id);

    if (error) {
      throw new Error(`Failed to delete GPX file: ${error.message}`);
    }
  }

  /**
   * Get user's credit transaction history
   */
  static async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    // First get the user profile to get the user_id
    const profile = await this.getProfile(userId);
    if (!profile) return [];

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error getting credit transactions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Upload GPX file to storage
   */
  static async uploadGPXFile(
    userId: string,
    file: File
  ): Promise<{ path: string; url: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('gpx-files')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('gpx-files')
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  }

  /**
   * Download GPX file from storage
   */
  static async downloadGPXFile(storagePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('gpx-files')
      .download(storagePath);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return data;
  }
}

/**
 * React hook for user profile management
 */
export function useUserProfile() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [credits, setCredits] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isLoaded && user) {
      loadProfile();
    } else if (isLoaded && !user) {
      setProfile(null);
      setCredits(0);
      setLoading(false);
    }
  }, [isLoaded, user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Create or update profile
      const profile = await UserService.createOrUpdateProfile(
        user.id,
        user.email || ''
      );

      setProfile(profile);
      setCredits(profile.credits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshCredits = async () => {
    if (!user) return;

    try {
      const balance = await UserService.getCreditBalance(user.id);
      setCredits(balance);
    } catch (err) {
      console.error('Failed to refresh credits:', err);
    }
  };

  return {
    profile,
    credits,
    loading,
    error,
    refreshCredits,
    reload: loadProfile
  };
}