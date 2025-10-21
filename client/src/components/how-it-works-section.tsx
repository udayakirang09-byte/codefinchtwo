export default function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Choose Your Path",
      description: "Browse our mentor profiles and find the perfect teacher for your child's interests and skill level.",
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      alt: "Online classroom environment with students",
    },
    {
      number: 2,
      title: "Book & Connect",
      description: "Schedule sessions that work for your family's schedule and connect instantly through our secure platform.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      alt: "Mentor teaching student programming concepts",
    },
    {
      number: 3,
      title: "Learn & Grow",
      description: "Watch your child build confidence and gain new skills on preferred subjects through engaging, personalized learning experiences.",
      image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
      alt: "Children programming and celebrating success",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-how-it-works-title">
            Simple Steps to <span className="text-gradient">Start Learning</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-how-it-works-description">
            Our platform makes it easy for kids to connect with amazing mentors and start their learning journey.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step) => (
            <div key={step.number} className="text-center" data-testid={`step-${step.number}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 ${
                step.number === 1 ? "bg-primary text-primary-foreground" :
                step.number === 2 ? "bg-secondary text-secondary-foreground" :
                "bg-accent text-accent-foreground"
              }`} data-testid={`step-number-${step.number}`}>
                {step.number}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4" data-testid={`step-title-${step.number}`}>
                {step.title}
              </h3>
              <p className="text-muted-foreground mb-6" data-testid={`step-description-${step.number}`}>
                {step.description}
              </p>
              <img 
                src={step.image} 
                alt={step.alt} 
                className="rounded-xl shadow-lg w-full h-48 object-cover" 
                data-testid={`step-image-${step.number}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
