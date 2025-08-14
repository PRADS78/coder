export type FieldType =
  | "short-text"
  | "long-text"
  | "date-picker"
  | "dropdown"
  | "file-upload"
  | "number"
  | "udf-designation"
  | "udf-department"
  | "udf-location"
  | "udf-blood-group"
  | "udf-education";

export type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY/MM/DD";

export type SelectionType = "single" | "multi";

export interface DropdownOption {
  id: string;
  label: string;
  value: string;
}

export interface BaseFieldProperties {
  placeholder?: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface DatePickerProperties extends BaseFieldProperties {
  dateFormat: DateFormat;
}

export interface DropdownProperties extends BaseFieldProperties {
  options: DropdownOption[];
  selectionType: SelectionType;
  allowOther?: boolean;
}

export interface NumberProperties extends BaseFieldProperties {
  min?: number;
  max?: number;
  step?: number;
}

export interface FileUploadProperties extends BaseFieldProperties {
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
}

export type FieldProperties =
  | BaseFieldProperties
  | DatePickerProperties
  | DropdownProperties
  | NumberProperties
  | FileUploadProperties;

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  showDescription: boolean;
  properties: FieldProperties;
  order: number;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

// New flexible form item type - can be either a field or a section
export type FormItem = FormField | FormSection;

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  items: FormItem[]; // Changed from sections to items
  createdAt: Date;
  updatedAt: Date;
}

// Re-export from field registry for backward compatibility
export {
  FIELD_TYPE_REGISTRY as FIELD_TYPES,
  getFieldDefinition,
  createFieldFromType as createDefaultField,
} from "./field-registry";

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const createDefaultForm = (): FormSchema => ({
  id: generateId(),
  title: "Untitled Form",
  description: "",
  items: [], // Start with empty items array instead of a default section
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createDefaultSection = (): FormSection => ({
  id: generateId(),
  title: "New Section",
  description: "",
  fields: [],
  order: 0,
});

// Utility functions
export const isFormField = (item: FormItem): item is FormField => {
  return "type" in item;
};

export const isFormSection = (item: FormItem): item is FormSection => {
  return "fields" in item;
};

// Helper function to get all fields from form items (both direct fields and section fields)
export const getAllFields = (items: FormItem[]): FormField[] => {
  const fields: FormField[] = [];

  items.forEach((item) => {
    if (isFormField(item)) {
      fields.push(item);
    } else if (isFormSection(item)) {
      fields.push(...item.fields);
    }
  });

  return fields;
};
