import React from 'react';

const AuditTrail = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Audit Trail</h1>
        <p className="text-muted-foreground mt-1">Review ledger events, security triggers, and API logs</p>
      </div>
      <div className="p-8 text-center bg-card border border-border rounded-xl text-muted-foreground">
        Audit trail table modules will be set up in the next step.
      </div>
    </div>
  );
};

export default AuditTrail;
