import { FormField, FieldType } from "./form-schema";

// Base interface for field type definitions
export interface FieldTypeDefinition {
  label: string;
  icon: string;
  category: "input" | "udf" | "special";
  description?: string;
  defaultProperties?: Record<string, any>;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  renderProps?: {
    placeholder?: string;
    helpText?: string;
  };
}

// Enhanced field type registry
export const FIELD_TYPE_REGISTRY: Record<FieldType, FieldTypeDefinition> = {
  "short-text": {
    label: "Short Text",
    icon: "📝",
    category: "input",
    description: "Single line text input",
    defaultProperties: {
      placeholder: "Enter text",
      maxLength: 255,
    },
    validation: {
      maxLength: 255,
    },
  },
  "long-text": {
    label: "Long Text",
    icon: "📄",
    category: "input",
    description: "Multi-line text area",
    defaultProperties: {
      placeholder: "Enter detailed text",
      rows: 4,
      maxLength: 2000,
    },
    validation: {
      maxLength: 2000,
    },
  },
  "date-picker": {
    label: "Date Picker",
    icon: "📅",
    category: "input",
    description: "Date selection field",
    defaultProperties: {
      dateFormat: "MM/DD/YYYY",
      placeholder: "Select a date",
    },
  },
  dropdown: {
    label: "Dropdown",
    icon: "📋",
    category: "input",
    description: "Single or multiple choice selection",
    defaultProperties: {
      options: [{ id: "1", label: "Option 1", value: "option1" }],
      selectionType: "single",
      placeholder: "Select an option",
    },
  },
  "file-upload": {
    label: "File Upload",
    icon: "📎",
    category: "input",
    description: "File upload field with 2MB limit",
    defaultProperties: {
      acceptedTypes: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
      maxSize: 2097152, // 2MB
      multiple: false,
    },
    validation: {
      custom: (value: File) => {
        if (!value) return null;
        if (value.size > 2097152) return "File size must be less than 2MB";
        return null;
      },
    },
  },
  number: {
    label: "Number",
    icon: "🔢",
    category: "input",
    description: "Numeric input field",
    defaultProperties: {
      placeholder: "Enter a number",
      min: 0,
      step: 1,
    },
    validation: {
      pattern: "^[0-9]+$",
    },
  },
  "udf-designation": {
    label: "Designation",
    icon: "💼",
    category: "udf",
    description: "User's job title or designation",
    defaultProperties: {
      placeholder: "Auto-filled from user data",
    },
  },
  "udf-department": {
    label: "Department",
    icon: "🏢",
    category: "udf",
    description: "User's department",
    defaultProperties: {
      placeholder: "Auto-filled from user data",
    },
  },
  "udf-location": {
    label: "Location",
    icon: "📍",
    category: "udf",
    description: "User's location",
    defaultProperties: {
      placeholder: "Auto-filled from user data",
    },
  },
  "udf-blood-group": {
    label: "Blood Group",
    icon: "🩸",
    category: "udf",
    description: "User's blood group",
    defaultProperties: {
      placeholder: "Auto-filled from user data",
    },
  },
  "udf-education": {
    label: "Education",
    icon: "🎓",
    category: "udf",
    description: "User's education level",
    defaultProperties: {
      placeholder: "Auto-filled from user data",
    },
  },
};

// Utility function to get field definition
export const getFieldDefinition = (type: FieldType): FieldTypeDefinition => {
  return FIELD_TYPE_REGISTRY[type];
};

// Utility function to get all field types by category
export const getFieldsByCategory = (category: "input" | "udf" | "special") => {
  return Object.entries(FIELD_TYPE_REGISTRY)
    .filter(([_, def]) => def.category === category)
    .map(([type, def]) => ({ type: type as FieldType, ...def }));
};

// Generic field creator function
export const createFieldFromType = (
  type: FieldType,
  overrides: Partial<FormField> = {},
): Omit<FormField, "id" | "order"> => {
  const definition = getFieldDefinition(type);

  return {
    type,
    label: definition.label,
    description: "",
    required: false,
    showDescription: false,
    properties: definition.defaultProperties || {},
    ...overrides,
  };
};

// Validation function using registry
export const validateFieldValue = (
  field: FormField,
  value: any,
): string | null => {
  const definition = getFieldDefinition(field.type);

  if (!definition.validation) return null;

  const validation = definition.validation;

  // Required validation
  if (field.required && (!value || value === "")) {
    return `${field.label} is required`;
  }

  // Skip other validations if value is empty and field is not required
  if (!value) return null;

  // Custom validation
  if (validation.custom) {
    return validation.custom(value);
  }

  // String length validation
  if (typeof value === "string") {
    if (validation.minLength && value.length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `${field.label} must be no more than ${validation.maxLength} characters`;
    }
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      return `${field.label} format is invalid`;
    }
  }

  return null;
};

// Function to register a new field type (for extensions)
export const registerFieldType = (
  type: string,
  definition: FieldTypeDefinition,
): void => {
  (FIELD_TYPE_REGISTRY as any)[type] = definition;
};

// Function to get all available field types
export const getAllFieldTypes = (): FieldType[] => {
  return Object.keys(FIELD_TYPE_REGISTRY) as FieldType[];
};

// Function to check if a field type exists
export const isValidFieldType = (type: string): type is FieldType => {
  return type in FIELD_TYPE_REGISTRY;
};
