export const logger = {
  info(message: string) {
    console.log(message);
  },
  error(message: string, error?: unknown) {
    if (error) {
      console.error(message, error);
      return;
    }

    console.error(message);
  },
};
