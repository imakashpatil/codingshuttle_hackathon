import React from 'react';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure middleware channels, gateway limits, and credentials</p>
      </div>
      <div className="p-8 text-center bg-card border border-border rounded-xl text-muted-foreground">
        System configurations and secrets will be set up in the next step.
      </div>
    </div>
  );
};

export default SettingsPage;
