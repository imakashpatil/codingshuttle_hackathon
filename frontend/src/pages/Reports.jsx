import React from 'react';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports & DLQ Retry</h1>
        <p className="text-muted-foreground mt-1">Ingest tracking stats, metrics analysis, and DLQ dispatch management</p>
      </div>
      <div className="p-8 text-center bg-card border border-border rounded-xl text-muted-foreground">
        Delivery metrics graphs and DLQ retry actions will be set up in the next step.
      </div>
    </div>
  );
};

export default Reports;
