import { useState } from 'react';
import { DisputesProvider } from '@/hooks/useDisputes';
import { CreateDisputeForm } from '@/components/disputes/CreateDisputeForm';
import { DisputeList } from '@/components/disputes/DisputeList';
import { DisputeDetail } from '@/components/disputes/DisputeDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Plus } from 'lucide-react';

export default function DisputesPage() {
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('disputes');

  const handleSelectDispute = (disputeId: string) => {
    setSelectedDisputeId(disputeId);
  };

  const handleBackToList = () => {
    setSelectedDisputeId(null);
  };

  const handleCreateSuccess = () => {
    setActiveTab('disputes');
  };

  return (
    <DisputesProvider>
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dispute Resolution</h1>
            <p className="text-muted-foreground">
              Manage disputes and resolve issues with orders
            </p>
          </div>

          {selectedDisputeId ? (
            <DisputeDetail 
              disputeId={selectedDisputeId} 
              onBack={handleBackToList}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="disputes" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  My Disputes
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Dispute
                </TabsTrigger>
              </TabsList>

              <TabsContent value="disputes" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Disputes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DisputeList onSelectDispute={handleSelectDispute} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="create" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Dispute</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CreateDisputeForm onSuccess={handleCreateSuccess} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </DisputesProvider>
  );
}