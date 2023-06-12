/**
 * Utility function for development purposes to add artificial delay
 * to check working of loading states
 */

const pause: (milliseconds: number) => Promise<void> = (milliseconds: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
};

export default pause;
