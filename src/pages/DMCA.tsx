import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DMCA = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" role="main" className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">DMCA Policy</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notice of Copyright Infringement</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Craft Local respects the intellectual property rights of others and expects our users to do the same. 
              We respond to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA).
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filing a DMCA Takedown Notice</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>If you believe your copyrighted work has been infringed, please provide our DMCA Agent with the following information:</p>
            <ol className="mt-2 space-y-2">
              <li>A physical or electronic signature of the copyright owner or authorized representative</li>
              <li>Identification of the copyrighted work claimed to have been infringed</li>
              <li>Identification of the infringing material and its location on our platform (URL)</li>
              <li>Your contact information (address, telephone number, and email)</li>
              <li>A statement that you have a good faith belief that the use is not authorized</li>
              <li>A statement that the information in the notice is accurate and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>DMCA Agent Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">Craft Local DMCA Agent</p>
            <p className="mt-2">
              <strong>Email:</strong> dmca@craftlocal.net<br />
              <strong>Address:</strong> [Your Registered Agent Address]<br />
              <strong>Phone:</strong> [Your Contact Phone]
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Note: Our DMCA agent is registered with the U.S. Copyright Office.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Response Timeline</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              We will respond to valid DMCA notices within 48 hours. If we determine the claim is valid, 
              we will remove or disable access to the allegedly infringing material.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Counter-Notice Procedure</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              If you believe your content was removed in error, you may file a counter-notice containing:
            </p>
            <ol className="mt-2 space-y-2">
              <li>Your physical or electronic signature</li>
              <li>Identification of the removed material and its prior location</li>
              <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
              <li>Your name, address, phone number, and consent to jurisdiction</li>
            </ol>
            <p className="mt-4">
              Upon receipt of a valid counter-notice, we will forward it to the original complainant. 
              If they do not file a court action within 10-14 business days, we may restore the content.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Repeat Infringer Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              Craft Local will terminate the accounts of users who are repeat infringers of copyright in appropriate circumstances.
            </p>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-8">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default DMCA;
