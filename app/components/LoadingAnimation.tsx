import { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  progress: number;
}

const LoadingAnimation = ({ progress }: LoadingAnimationProps) => {
  const [mounted, setMounted] = useState(false);
  const [loadingText, setLoadingText] = useState('Scanning the blockchain');

  useEffect(() => {
    setMounted(true);
    
    const textInterval = setInterval(() => {
      setLoadingText(prev => {
        const texts = [
          'Scanning the blockchain',
          'Mining for transactions',
          'Crunching numbers',
          'Analyzing patterns',
          'woah thats a big one...',
          'uhhhh',
          'Almost there'
        ];
        const currentIndex = texts.indexOf(prev);
        return texts[(currentIndex + 1) % texts.length];
      });
    }, 2000);

    return () => {
      clearInterval(textInterval);
    };
  }, []);

  // Show static content during SSR and initial hydration
  if (!mounted) {
    return (
      <div className="space-y-4 py-8 px-4">
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-solana-purple/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-mono text-solana-green">0%</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-mono text-gray-400">
            Scanning the blockchain
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-8 px-4">
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-solana-purple/20" />
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-solana-green animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-mono text-solana-green">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm font-mono text-gray-400 animate-pulse">
          {loadingText}
        </p>
        <div className="flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-solana-purple animate-bounce"
              style={{ 
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation; 