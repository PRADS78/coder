/**
 * Enhanced Validation Service
 *
 * Provides centralized, extensible validation for all form fields
 * with better error handling and custom validation support
 */

import { FormField, FormSchema } from "./form-schema";
import { validateFieldValue } from "./field-registry";

export interface ValidationError {
  fieldId: string;
  message: string;
  type: "required" | "format" | "custom" | "length";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

// Enhanced validation service
export class ValidationService {
  private customValidators: Map<string, (value: any) => string | null> =
    new Map();

  // Register custom validator for specific field
  registerValidator(
    fieldId: string,
    validator: (value: any) => string | null,
  ): void {
    this.customValidators.set(fieldId, validator);
  }

  // Validate single field
  validateField(field: FormField, value: any): ValidationError | null {
    // Use registry validation first
    const registryError = validateFieldValue(field, value);
    if (registryError) {
      return {
        fieldId: field.id,
        message: registryError,
        type: this.getErrorType(registryError),
      };
    }

    // Check custom validators
    const customValidator = this.customValidators.get(field.id);
    if (customValidator) {
      const customError = customValidator(value);
      if (customError) {
        return {
          fieldId: field.id,
          message: customError,
          type: "custom",
        };
      }
    }

    return null;
  }

  // Validate entire form
  validateForm(
    schema: FormSchema,
    values: Record<string, any>,
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Get all fields from the schema
    const allFields = this.getAllFieldsFromSchema(schema);

    // Validate each field
    allFields.forEach((field) => {
      const value = values[field.id];
      const error = this.validateField(field, value);
      if (error) {
        errors.push(error);
      }
    });

    // Add form-level validations
    const formLevelErrors = this.validateFormLevel(schema, values);
    errors.push(...formLevelErrors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Get all fields from schema (including nested sections)
  private getAllFieldsFromSchema(schema: FormSchema): FormField[] {
    const fields: FormField[] = [];

    schema.items.forEach((item) => {
      if ("type" in item) {
        // It's a field
        fields.push(item as FormField);
      } else if ("fields" in item) {
        // It's a section
        fields.push(...item.fields);
      }
    });

    return fields;
  }

  // Form-level validations (cross-field validation)
  private validateFormLevel(
    schema: FormSchema,
    values: Record<string, any>,
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Example: Validate that email and confirm email match
    // This can be extended for any cross-field validation

    return errors;
  }

  // Determine error type from message
  private getErrorType(message: string): ValidationError["type"] {
    if (message.includes("required")) return "required";
    if (message.includes("length") || message.includes("characters"))
      return "length";
    if (message.includes("format") || message.includes("invalid"))
      return "format";
    return "custom";
  }

  // Clear all custom validators
  clearValidators(): void {
    this.customValidators.clear();
  }

  // Remove specific validator
  removeValidator(fieldId: string): void {
    this.customValidators.delete(fieldId);
  }

  // Get validation summary
  getValidationSummary(result: ValidationResult): string {
    if (result.isValid) return "Form is valid";

    const errorCount = result.errors.length;
    const warningCount = result.warnings?.length || 0;

    let summary = `${errorCount} error${errorCount !== 1 ? "s" : ""}`;
    if (warningCount > 0) {
      summary += `, ${warningCount} warning${warningCount !== 1 ? "s" : ""}`;
    }

    return summary;
  }
}

// Global validation service instance
export const validationService = new ValidationService();

// Convenience function for form validation
export const validateFormData = (
  schema: FormSchema,
  values: Record<string, any>,
): ValidationResult => {
  return validationService.validateForm(schema, values);
};

// Convenience function for field validation
export const validateFieldData = (
  field: FormField,
  value: any,
): ValidationError | null => {
  return validationService.validateField(field, value);
};
