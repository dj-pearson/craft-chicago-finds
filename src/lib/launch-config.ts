// Launch configuration for CraftLocal Chicago
export const LAUNCH_CONFIG = {
  // Launch date and timing
  LAUNCH_DATE: new Date('2024-11-01T00:00:00-05:00'), // November 1st, 2024 CST
  LAUNCH_CITY: 'Chicago',
  LAUNCH_STATE: 'Illinois',
  LAUNCH_TIMEZONE: 'America/Chicago',
  
  // Launch status
  IS_PRE_LAUNCH: true,
  ALLOW_EARLY_ACCESS: false,
  
  // Registration controls
  REGISTRATION_ENABLED: false,
  SELLER_REGISTRATION_ENABLED: false,
  BUYER_REGISTRATION_ENABLED: false,
  
  // Pre-launch features
  SHOW_COMING_SOON: true,
  SHOW_COUNTDOWN: true,
  ALLOW_EMAIL_SIGNUP: true,
  ALLOW_SELLER_INTEREST: true,
  
  // Launch messaging
  LAUNCH_HEADLINE: "Chicago's Local Craft Marketplace Launches November 1st",
  LAUNCH_SUBHEADLINE: "Connect with local artisans and discover unique handmade treasures in the Windy City",
  PRE_LAUNCH_MESSAGE: "We're putting the finishing touches on Chicago's premier marketplace for local artisans and craft lovers.",
  
  // Contact and social
  LAUNCH_EMAIL: "chicago@craftlocal.com",
  PRESS_EMAIL: "press@craftlocal.com",
  SUPPORT_EMAIL: "hello@craftlocal.com",
  
  // Launch metrics goals
  LAUNCH_GOALS: {
    INITIAL_SELLERS: 50,
    INITIAL_PRODUCTS: 200,
    FIRST_MONTH_GMV: 10000,
    EMAIL_SIGNUPS: 1000
  }
};

// Helper functions
export const isLaunched = (): boolean => {
  return new Date() >= LAUNCH_CONFIG.LAUNCH_DATE;
};

export const isPreLaunch = (): boolean => {
  return !isLaunched() && LAUNCH_CONFIG.IS_PRE_LAUNCH;
};

export const getDaysUntilLaunch = (): number => {
  const now = new Date();
  const launch = LAUNCH_CONFIG.LAUNCH_DATE;
  const diffTime = launch.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getHoursUntilLaunch = (): number => {
  const now = new Date();
  const launch = LAUNCH_CONFIG.LAUNCH_DATE;
  const diffTime = launch.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60));
};

export const getLaunchCountdown = () => {
  const now = new Date();
  const launch = LAUNCH_CONFIG.LAUNCH_DATE;
  const diffTime = launch.getTime() - now.getTime();
  
  if (diffTime <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLaunched: true };
  }
  
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, isLaunched: false };
};

export const formatLaunchDate = (format: 'full' | 'short' | 'month-day' = 'full'): string => {
  const date = LAUNCH_CONFIG.LAUNCH_DATE;
  
  switch (format) {
    case 'full':
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: LAUNCH_CONFIG.LAUNCH_TIMEZONE
      });
    case 'short':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: LAUNCH_CONFIG.LAUNCH_TIMEZONE
      });
    case 'month-day':
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        timeZone: LAUNCH_CONFIG.LAUNCH_TIMEZONE
      });
    default:
      return date.toLocaleDateString('en-US');
  }
};
