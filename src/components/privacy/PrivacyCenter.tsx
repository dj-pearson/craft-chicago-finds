/**
 * Privacy Center
 * Central hub for all privacy-related actions (GDPR/CCPA compliance)
 */

import { useState } from 'react';
import { Shield, Download, Trash2, Eye, Settings, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useConsent } from '@/hooks/useConsent';
import { DataExportRequest } from './DataExportRequest';
import { DataDeletionRequest } from './DataDeletionRequest';
import { CCPAControls } from './CCPAControls';
import { cn } from '@/lib/utils';

interface PrivacyCenterProps {
  className?: string;
}

export function PrivacyCenter({ className }: PrivacyCenterProps) {
  const { user } = useAuth();
  const { openPreferences, applicableRegulations, isCaliforniaUser, isEUUser } = useConsent();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
            Privacy Center
          </h1>
          <p className="text-muted-foreground">
            Manage your privacy settings and exercise your data rights
          </p>
        </div>
      </div>

      {/* Regulatory notice */}
      {applicableRegulations.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Your Privacy Rights
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Based on your location, you are protected by: {applicableRegulations.join(', ')}.
                  {isEUUser && ' Under GDPR, you have the right to access, rectify, erase, and port your personal data.'}
                  {isCaliforniaUser && ' Under CCPA, you have the right to know, delete, and opt-out of the sale of your personal information.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Data
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-2">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete Data
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Data We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  Data We Collect
                </CardTitle>
                <CardDescription>Types of personal information we process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                    Account information (name, email)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                    Transaction history
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" aria-hidden="true" />
                    Browsing activity (with consent)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" aria-hidden="true" />
                    Device information (with consent)
                  </li>
                </ul>
                <Button variant="link" className="p-0 h-auto text-sm" asChild>
                  <a href="/privacy">Read full privacy policy</a>
                </Button>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                  Your Rights
                </CardTitle>
                <CardDescription>Actions you can take</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Export your data
                  </li>
                  <li className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Request data deletion
                  </li>
                  <li className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Manage cookie preferences
                  </li>
                  <li className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    View collected data
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common privacy tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={openPreferences}
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Manage Cookie Preferences
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab('export')}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download My Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => setActiveTab('delete')}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete My Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CCPA specific section */}
          {isCaliforniaUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                  California Privacy Rights (CCPA)
                </CardTitle>
                <CardDescription>
                  Additional rights for California residents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CCPAControls />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export">
          <DataExportRequest />
        </TabsContent>

        {/* Delete Tab */}
        <TabsContent value="delete">
          <DataDeletionRequest />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cookie Preferences</CardTitle>
              <CardDescription>
                Manage which cookies and tracking technologies you allow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={openPreferences} className="gap-2">
                <Settings className="h-4 w-4" aria-hidden="true" />
                Open Cookie Preferences
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication Preferences</CardTitle>
              <CardDescription>
                Control how we contact you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your email notification preferences in your account settings.
              </p>
              <Button variant="outline" asChild>
                <a href="/settings/notifications">Manage Notifications</a>
              </Button>
            </CardContent>
          </Card>

          {isCaliforniaUser && (
            <Card>
              <CardHeader>
                <CardTitle>Do Not Sell My Personal Information</CardTitle>
                <CardDescription>
                  California residents can opt-out of the sale of personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CCPAControls showDoNotSellOnly />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PrivacyCenter;
