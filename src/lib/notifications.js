import { toast } from 'sonner';

const normalizeOptions = (descriptionOrOptions, options = {}) => {
  if (
    descriptionOrOptions
    && typeof descriptionOrOptions === 'object'
    && !Array.isArray(descriptionOrOptions)
  ) {
    return descriptionOrOptions;
  }

  return {
    ...(descriptionOrOptions ? { description: descriptionOrOptions } : {}),
    ...options,
  };
};

export const notifySuccess = (title, descriptionOrOptions, options) => (
  toast.success(title, {
    duration: 3200,
    ...normalizeOptions(descriptionOrOptions, options),
  })
);

export const notifyError = (title, descriptionOrOptions, options) => (
  toast.error(title, {
    duration: 4500,
    ...normalizeOptions(descriptionOrOptions, options),
  })
);

export const notifyInfo = (title, descriptionOrOptions, options) => (
  toast(title, {
    duration: 3600,
    ...normalizeOptions(descriptionOrOptions, options),
  })
);
