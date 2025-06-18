import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, Settings, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InterviewerAccessManagement } from "@/components/settings/InterviewerAccessManagement";

const CompanySettings = () => {
  const { toast } = useToast();
  const { isTenantAdmin } = useAuth();
  const [companyName, setCompanyName] = useState("InterviewAI");
  const [companyEmail, setCompanyEmail] = useState("contact@interviewai.com");
  const [loading, setLoading] = useState(false);

  const saveCompanyProfile = () => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings saved",
        description: "Your company profile has been updated successfully",
      });
    }, 1000);
  };

  const saveUserSettings = () => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "User settings saved",
        description: "User settings have been updated successfully",
      });
    }, 1000);
  };

  const saveAppSettings = () => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "App settings saved",
        description: "Application settings have been updated successfully",
      });
    }, 1000);
  };

  const updatePaymentMethod = () => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Payment method updated",
        description: "Your payment information has been updated successfully",
      });
    }, 1000);
  };

  const changePlan = (plan: string) => {
    setLoading(true);

    // Mock API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Plan updated",
        description: `Successfully switched to ${plan} plan`,
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          Company Settings
        </h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Building size={16} />
              <span>Company Profile</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users size={16} />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard size={16} />
              <span>Billing</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} />
              <span>App Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Company Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Manage your company information and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-email">Company Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-logo">Company Logo</Label>
                  <div className="border border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your company logo (SVG, PNG or JPG)
                    </p>
                    <Button variant="outline">Upload Logo</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={saveCompanyProfile}
                  disabled={loading}
                  className="ml-auto"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Users</CardTitle>
                  <CardDescription>
                    Add, edit, or remove users from your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border">
                    <div className="p-4">
                      <div className="grid grid-cols-4 font-medium">
                        <div>Name</div>
                        <div>Email</div>
                        <div>Role</div>
                        <div className="text-right">Actions</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="p-4">
                      <div className="grid grid-cols-4 items-center">
                        <div>John Doe</div>
                        <div>john@interviewai.com</div>
                        <div>Admin</div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="p-4">
                      <div className="grid grid-cols-4 items-center">
                        <div>Jane Smith</div>
                        <div>jane@interviewai.com</div>
                        <div>Interviewer</div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={saveUserSettings}
                    disabled={loading}
                    className="ml-auto"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>

              {/* Interviewer Access Management - Only visible to Tenant Admins */}
              {isTenantAdmin && <InterviewerAccessManagement />}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Professional Plan
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            $99/month • Billed monthly
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">$99</p>
                          <p className="text-sm text-muted-foreground">
                            per month
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">✓ Unlimited interviews</p>
                        <p className="text-sm">✓ Advanced AI analytics</p>
                        <p className="text-sm">✓ 50 team members</p>
                        <p className="text-sm">✓ Priority support</p>
                      </div>
                    </div>

                    {/* Plan Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Starter</h4>
                        <p className="text-2xl font-bold mb-2">
                          $49<span className="text-sm font-normal">/mo</span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Perfect for small teams
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => changePlan("Starter")}
                        >
                          Downgrade
                        </Button>
                      </div>

                      <div className="border-2 border-primary rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Professional</h4>
                        <p className="text-2xl font-bold mb-2">
                          $99<span className="text-sm font-normal">/mo</span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Current plan
                        </p>
                        <Button variant="secondary" className="w-full" disabled>
                          Current Plan
                        </Button>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Enterprise</h4>
                        <p className="text-2xl font-bold mb-2">
                          $299<span className="text-sm font-normal">/mo</span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Unlimited everything
                        </p>
                        <Button
                          className="w-full"
                          onClick={() => changePlan("Enterprise")}
                        >
                          Upgrade
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>
                    Update your payment information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">
                          Expires 12/25
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={updatePaymentMethod}>
                      Update
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Email</Label>
                    <Input defaultValue="billing@company.com" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto" onClick={updatePaymentMethod}>
                    Save Payment Details
                  </Button>
                </CardFooter>
              </Card>

              {/* Billing History */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View and download your past invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="p-4">
                      <div className="grid grid-cols-4 font-medium text-sm">
                        <div>Date</div>
                        <div>Description</div>
                        <div>Amount</div>
                        <div className="text-right">Invoice</div>
                      </div>
                    </div>
                    <Separator />
                    <div className="divide-y">
                      <div className="p-4">
                        <div className="grid grid-cols-4 items-center text-sm">
                          <div>Dec 1, 2024</div>
                          <div>Professional Plan</div>
                          <div>$99.00</div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-4 items-center text-sm">
                          <div>Nov 1, 2024</div>
                          <div>Professional Plan</div>
                          <div>$99.00</div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-4 items-center text-sm">
                          <div>Oct 1, 2024</div>
                          <div>Professional Plan</div>
                          <div>$99.00</div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* App Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure how InterviewAI works for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">Default AI Model</Label>
                  <select
                    id="ai-model"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5">GPT-3.5</option>
                    <option value="claude-3">Claude 3</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview-duration">
                    Default Interview Duration
                  </Label>
                  <select
                    id="interview-duration"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="recording-consent">
                      Require Candidate Consent
                    </Label>
                    <input
                      type="checkbox"
                      id="recording-consent"
                      className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                      defaultChecked
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ask candidates for consent before recording interviews
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-assessment">
                      Automatic Assessment
                    </Label>
                    <input
                      type="checkbox"
                      id="auto-assessment"
                      className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                      defaultChecked
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate AI assessment reports immediately after interviews
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={saveAppSettings}
                  disabled={loading}
                  className="ml-auto"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompanySettings;
