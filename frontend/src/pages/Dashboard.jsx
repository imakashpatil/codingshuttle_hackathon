import React from 'react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">System Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time middleware performance metrics & sync indicators</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards */}
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="text-sm font-medium text-muted-foreground">Total Ingested Events</div>
          <div className="text-2xl font-bold text-foreground mt-1">--</div>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="text-sm font-medium text-muted-foreground">Active Templates</div>
          <div className="text-2xl font-bold text-foreground mt-1">--</div>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
          <div className="text-2xl font-bold text-foreground mt-1">--</div>
        </div>
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="text-sm font-medium text-muted-foreground">DLQ Backlog</div>
          <div className="text-2xl font-bold text-foreground mt-1">--</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
