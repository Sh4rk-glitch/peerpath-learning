import Navigation from "@/components/Navigation";

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-16">
        <h1 className="mb-4">Help Center</h1>
        <p className="text-muted-foreground">Find answers to common questions and troubleshooting guides.</p>
      </div>
    </div>
  );
};

export default Help;
