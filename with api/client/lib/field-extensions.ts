/**
 * Enhanced Field Extension System
 *
 * This module provides a simple, robust way to add new field types
 * without modifying core files. Just import and call registerFieldType()
 */

import { registerFieldType, FieldTypeDefinition } from "./field-registry";
import { FieldType } from "./form-schema";

// Example: Adding a new Rating Scale field type
// This demonstrates how easy it is to extend the system

export const addRatingScaleField = () => {
  registerFieldType("rating-scale", {
    label: "Rating Scale",
    icon: "⭐",
    category: "input",
    description: "1-5 star rating or numeric scale",
    defaultProperties: {
      minValue: 1,
      maxValue: 5,
      step: 1,
      scaleType: "stars", // "stars" or "numbers"
    },
    validation: {
      custom: (value: number) => {
        if (typeof value !== "number") return "Please select a rating";
        if (value < 1 || value > 5) return "Rating must be between 1 and 5";
        return null;
      },
    },
    renderProps: {
      placeholder: "Select rating",
      helpText: "Rate from 1 to 5",
    },
  });
};

// Example: Adding a Phone Number field
export const addPhoneField = () => {
  registerFieldType("phone", {
    label: "Phone Number",
    icon: "📞",
    category: "input",
    description: "Phone number input with validation",
    defaultProperties: {
      placeholder: "Enter phone number",
      format: "international", // "local" or "international"
    },
    validation: {
      pattern: "^[+]?[1-9]?[0-9]{7,15}$",
      custom: (value: string) => {
        if (!value) return null;
        const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
        if (!phoneRegex.test(value)) {
          return "Please enter a valid phone number";
        }
        return null;
      },
    },
  });
};

// Example: Adding a Multi-Select Checkbox field
export const addMultiSelectField = () => {
  registerFieldType("multi-select", {
    label: "Multi Select",
    icon: "☑️",
    category: "input",
    description: "Multiple choice checkboxes",
    defaultProperties: {
      options: [
        { id: "1", label: "Option 1", value: "option1" },
        { id: "2", label: "Option 2", value: "option2" },
      ],
      minSelections: 0,
      maxSelections: null,
    },
    validation: {
      custom: (value: string[]) => {
        if (!Array.isArray(value)) return null;
        // Add custom validation logic here
        return null;
      },
    },
  });
};

// Function to initialize all extension fields
export const initializeFieldExtensions = () => {
  // Call these functions to register the new field types
  // Comment out any you don't want to use
  // addRatingScaleField();
  // addPhoneField();
  // addMultiSelectField();
};

// Export helper function for creating custom field types
export const createCustomFieldType = (
  type: string,
  definition: FieldTypeDefinition,
): void => {
  registerFieldType(type, definition);
};
