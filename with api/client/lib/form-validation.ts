import {
  FormField,
  FormSchema,
  FormItem,
  isFormField,
  isFormSection,
  getAllFields,
} from "./form-schema";

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateField = (
  field: FormField,
  value: any,
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required validation
  if (
    field.required &&
    (!value || (typeof value === "string" && value.trim() === ""))
  ) {
    errors.push({
      fieldId: field.id,
      message: `${field.label} is required`,
    });
    return errors;
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return errors;
  }

  // Type-specific validation
  switch (field.type) {
    case "short-text":
    case "long-text":
      if (typeof value === "string") {
        const properties = field.properties as any;
        if (
          properties.validation?.minLength &&
          value.length < properties.validation.minLength
        ) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be at least ${properties.validation.minLength} characters`,
          });
        }
        if (
          properties.validation?.maxLength &&
          value.length > properties.validation.maxLength
        ) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be no more than ${properties.validation.maxLength} characters`,
          });
        }
        if (properties.validation?.pattern) {
          const regex = new RegExp(properties.validation.pattern);
          if (!regex.test(value)) {
            errors.push({
              fieldId: field.id,
              message: `${field.label} format is invalid`,
            });
          }
        }
      }
      break;

    case "number":
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} must be a valid number`,
        });
      } else {
        const properties = field.properties as any;
        if (properties.min !== undefined && numValue < properties.min) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be at least ${properties.min}`,
          });
        }
        if (properties.max !== undefined && numValue > properties.max) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be no more than ${properties.max}`,
          });
        }
      }
      break;

    case "date-picker":
      if (value && !isValidDate(value)) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} must be a valid date`,
        });
      }
      break;

    case "dropdown":
      const properties = field.properties as any;
      if (properties.selectionType === "single" && Array.isArray(value)) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} allows only single selection`,
        });
      }
      if (properties.selectionType === "multi" && !Array.isArray(value)) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} requires array for multiple selection`,
        });
      }
      break;

    case "file-upload":
      if (value instanceof FileList || Array.isArray(value)) {
        const files = value instanceof FileList ? Array.from(value) : value;
        const fileProperties = field.properties as any;

        if (fileProperties.acceptedTypes?.length) {
          for (const file of files) {
            if (file instanceof File) {
              const extension = "." + file.name.split(".").pop()?.toLowerCase();
              if (!fileProperties.acceptedTypes.includes(extension)) {
                errors.push({
                  fieldId: field.id,
                  message: `${field.label} accepts only ${fileProperties.acceptedTypes.join(", ")} files`,
                });
                break;
              }
            }
          }
        }

        if (fileProperties.maxSize) {
          for (const file of files) {
            if (file instanceof File && file.size > fileProperties.maxSize) {
              errors.push({
                fieldId: field.id,
                message: `${field.label} file size must be less than ${formatFileSize(fileProperties.maxSize)}`,
              });
              break;
            }
          }
        }

        if (!fileProperties.multiple && files.length > 1) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} allows only single file upload`,
          });
        }
      }
      break;
  }

  return errors;
};

export const validateForm = (
  schema: FormSchema,
  values: Record<string, any>,
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Handle both old structure (sections) and new structure (items)
  if ("sections" in schema && schema.sections) {
    // Old structure for backward compatibility
    for (const section of schema.sections) {
      for (const field of section.fields) {
        const fieldErrors = validateField(field, values[field.id]);
        errors.push(...fieldErrors);
      }
    }
  } else if ("items" in schema && schema.items) {
    // New structure
    const allFields = getAllFields(schema.items);
    for (const field of allFields) {
      const fieldErrors = validateField(field, values[field.id]);
      errors.push(...fieldErrors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const isValidDate = (value: any): boolean => {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
