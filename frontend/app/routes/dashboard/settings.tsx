import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const Settings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskUpdates, setTaskUpdates] = useState(true);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and application settings.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose what notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications about workspace activities.
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="task-updates">Task Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when tasks are assigned or updated.
              </p>
            </div>
            <Switch
              id="task-updates"
              checked={taskUpdates}
              onCheckedChange={setTaskUpdates}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how TaskManager looks for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More appearance options coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
