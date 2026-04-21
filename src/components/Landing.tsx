type LandingProps = {
  onGetStarted: () => void;
};

const Landing = ({ onGetStarted }: LandingProps) => {
  return (
    <section className="landing" aria-label="Certora landing page">
      <h1>Certora</h1>
      <p>Generate certificates in seconds, not hours</p>
      <button type="button" onClick={onGetStarted}>
        Get Started
      </button>
    </section>
  );
};

export default Landing;
