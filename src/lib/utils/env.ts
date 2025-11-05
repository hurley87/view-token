/**
 * Environment variable validation utilities
 */

interface EnvValidationResult<T> {
  value: T;
  error?: never;
}

interface EnvValidationError {
  value?: never;
  error: {
    message: string;
    status: number;
  };
}

type EnvValidation<T> = EnvValidationResult<T> | EnvValidationError;

/**
 * Validates and retrieves an environment variable
 */
export function getEnvVar(key: string): EnvValidation<string> {
  const value = process.env[key];
  if (!value) {
    return {
      error: {
        message: `${key} environment variable is not set`,
        status: 500,
      },
    };
  }
  return { value };
}

/**
 * Validates multiple environment variables at once
 */
export function validateEnvVars(
  keys: string[]
): EnvValidation<Record<string, string>> {
  const envVars: Record<string, string> = {};
  
  for (const key of keys) {
    const result = getEnvVar(key);
    if (result.error) {
      return result;
    }
    envVars[key] = result.value;
  }
  
  return { value: envVars };
}

