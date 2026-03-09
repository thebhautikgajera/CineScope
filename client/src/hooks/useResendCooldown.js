import { useEffect, useState } from 'react';

// Custom hook for managing resend OTP cooldown timer
export const useResendCooldown = (cooldownSeconds = 30) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const startCooldown = () => {
    setCountdown(cooldownSeconds);
  };

  const resetCooldown = () => {
    setCountdown(0);
  };

  return {
    countdown,
    isCooldownActive: countdown > 0,
    startCooldown,
    resetCooldown,
  };
};

