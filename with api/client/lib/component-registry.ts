/**
 * Dynamic Component Registry
 *
 * Maps field types to your custom components with prop mapping
 * Enables using your own components without code changes
 */

import React from "react";
import { ComponentMapping, FieldDefinition } from "./config-service";

// Import your custom components here
// Replace these with your actual component imports
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Example: Import your custom components
// import { CustomInput } from "@/components/custom/CustomInput";
// import { CustomTextarea } from "@/components/custom/CustomTextarea";
// import { CustomFileUpload } from "@/components/custom/CustomFileUpload";
// import { CustomDatePicker } from "@/components/custom/CustomDatePicker";
// import { CustomSelect } from "@/components/custom/CustomSelect";
// import { CustomNumberInput } from "@/components/custom/CustomNumberInput";

export interface ComponentProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
  [key: string]: any;
}

class ComponentRegistry {
  private components: Map<string, React.ComponentType<any>> = new Map();

  constructor() {
    this.registerDefaultComponents();
  }

  // Register default components (fallback when custom components aren't available)
  private registerDefaultComponents() {
    this.components.set("Input", Input);
    this.components.set("Textarea", Textarea);
    this.components.set("Button", Button);
    this.components.set("Label", Label);

    // Register fallback components for missing ones
    this.components.set("FileUpload", this.createFallbackFileUpload());
    this.components.set("DatePicker", this.createFallbackDatePicker());
    this.components.set("Select", this.createFallbackSelect());
    this.components.set("NumberInput", this.createFallbackNumberInput());
  }

  // Register your custom components
  registerComponent(name: string, component: React.ComponentType<any>) {
    this.components.set(name, component);
    console.log(`✅ Registered custom component: ${name}`);
  }

  // Get component by name
  getComponent(name: string): React.ComponentType<any> | null {
    return this.components.get(name) || null;
  }

  // Render field with dynamic component and prop mapping
  renderField(
    fieldDef: FieldDefinition,
    props: ComponentProps,
  ): React.ReactElement | null {
    const Component = this.getComponent(fieldDef.component.component);

    if (!Component) {
      console.warn(`⚠️ Component not found: ${fieldDef.component.component}`);
      return this.renderFallbackField(fieldDef, props);
    }

    // Map props according to component mapping
    const mappedProps = this.mapProps(fieldDef.component, props);

    return React.createElement(Component, mappedProps);
  }

  // Map standard props to component-specific props
  private mapProps(
    componentMapping: ComponentMapping,
    standardProps: ComponentProps,
  ): Record<string, any> {
    const mapped: Record<string, any> = {};

    // Apply default props first
    if (componentMapping.defaultProps) {
      Object.assign(mapped, componentMapping.defaultProps);
    }

    // Map standard props to component-specific props
    Object.entries(componentMapping.propMapping).forEach(
      ([standardProp, componentProp]) => {
        if (standardProps[standardProp] !== undefined) {
          mapped[componentProp] = standardProps[standardProp];
        }
      },
    );

    // Pass through any unmapped props
    Object.entries(standardProps).forEach(([key, value]) => {
      if (!componentMapping.propMapping[key] && !mapped[key]) {
        mapped[key] = value;
      }
    });

    return mapped;
  }

  // Render fallback when component is missing
  private renderFallbackField(
    fieldDef: FieldDefinition,
    props: ComponentProps,
  ): React.ReactElement {
    console.log(`🔄 Using fallback for field type: ${fieldDef.type}`);

    // Simple fallback based on field type
    switch (fieldDef.type) {
      case "long-text":
        return React.createElement(Textarea, {
          value: props.value || "",
          onChange: (e: any) => props.onChange(e.target.value),
          placeholder: props.field.defaultProperties?.placeholder,
          disabled: props.disabled,
          rows: props.field.defaultProperties?.rows || 4,
        });

      case "file-upload":
        return this.createFallbackFileUpload()(props);

      case "date-picker":
        return this.createFallbackDatePicker()(props);

      case "dropdown":
        return this.createFallbackSelect()(props);

      case "number":
        return this.createFallbackNumberInput()(props);

      default:
        return React.createElement(Input, {
          value: props.value || "",
          onChange: (e: any) => props.onChange(e.target.value),
          placeholder: props.field.defaultProperties?.placeholder,
          disabled: props.disabled,
          type: fieldDef.type === "number" ? "number" : "text",
        });
    }
  }

  // Create fallback file upload component
  private createFallbackFileUpload() {
    return (props: ComponentProps) => {
      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          // Check file size (2MB limit)
          if (file.size > 2097152) {
            alert("File size must be less than 2MB");
            return;
          }
          props.onChange(file);
        }
      };

      return React.createElement("div", { className: "space-y-2" }, [
        React.createElement("input", {
          key: "file-input",
          type: "file",
          onChange: handleFileChange,
          accept: props.field.defaultProperties?.acceptedTypes?.join(","),
          disabled: props.disabled,
          className: "hidden",
          id: `file-${props.field.type}`,
        }),
        React.createElement("label", {
          key: "file-label",
          htmlFor: `file-${props.field.type}`,
          className:
            "cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center block hover:border-gray-400",
          children: [
            React.createElement(
              "div",
              {
                key: "upload-icon",
                className: "text-gray-400 mb-2",
              },
              "📎",
            ),
            React.createElement(
              "p",
              {
                key: "upload-text",
                className: "text-sm text-gray-600",
              },
              "Click to upload a file (max 2MB)",
            ),
          ],
        }),
      ]);
    };
  }

  // Create fallback date picker component
  private createFallbackDatePicker() {
    return (props: ComponentProps) =>
      React.createElement(Input, {
        type: "date",
        value: props.value || "",
        onChange: (e: any) => props.onChange(e.target.value),
        disabled: props.disabled,
        placeholder: props.field.defaultProperties?.placeholder,
      });
  }

  // Create fallback select component
  private createFallbackSelect() {
    return (props: ComponentProps) => {
      const options = props.field.defaultProperties?.options || [];

      return React.createElement("select", {
        value: props.value || "",
        onChange: (e: any) => props.onChange(e.target.value),
        disabled: props.disabled,
        className:
          "w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
        children: [
          React.createElement(
            "option",
            {
              key: "placeholder",
              value: "",
            },
            props.field.defaultProperties?.placeholder || "Select...",
          ),
          ...options.map((option: any) =>
            React.createElement(
              "option",
              {
                key: option.id,
                value: option.value,
              },
              option.label,
            ),
          ),
        ],
      });
    };
  }

  // Create fallback number input component
  private createFallbackNumberInput() {
    return (props: ComponentProps) =>
      React.createElement(Input, {
        type: "number",
        value: props.value || "",
        onChange: (e: any) => props.onChange(e.target.value),
        placeholder: props.field.defaultProperties?.placeholder,
        min: props.field.defaultProperties?.min,
        max: props.field.defaultProperties?.max,
        step: props.field.defaultProperties?.step,
        disabled: props.disabled,
      });
  }

  // Check if component is registered
  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  // List all registered components
  listComponents(): string[] {
    return Array.from(this.components.keys());
  }
}

// Global component registry instance
export const componentRegistry = new ComponentRegistry();

// Convenience functions for registering your custom components
export const registerCustomComponent = (
  name: string,
  component: React.ComponentType<any>,
) => {
  componentRegistry.registerComponent(name, component);
};

export const renderDynamicField = (
  fieldDef: FieldDefinition,
  props: ComponentProps,
) => {
  return componentRegistry.renderField(fieldDef, props);
};

// Helper to register all your custom components at once
export const registerCustomComponents = (
  components: Record<string, React.ComponentType<any>>,
) => {
  Object.entries(components).forEach(([name, component]) => {
    registerCustomComponent(name, component);
  });
};
