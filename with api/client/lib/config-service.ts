/**
 * Dynamic Configuration Service
 *
 * Loads field definitions from external blob/JSON with fallback to local schema
 * Enables zero-code-change field management
 */

export interface ComponentMapping {
  component: string; // Component name/path
  propMapping: Record<string, string>; // Maps standard props to component-specific props
  defaultProps?: Record<string, any>;
  wrapperProps?: Record<string, any>;
}

export interface FieldDefinition {
  type: string;
  label: string;
  icon: string;
  category: "input" | "udf" | "special";
  description?: string;
  component: ComponentMapping;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string; // Function name or validation rule
  };
  defaultProperties?: Record<string, any>;
}

export interface FormConfig {
  version: string;
  fields: FieldDefinition[];
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  metadata?: {
    name: string;
    description: string;
    lastUpdated: string;
  };
}

class ConfigService {
  private config: FormConfig | null = null;
  private fallbackConfig: FormConfig | null = null;
  private isLoading = false;

  // Default configuration (fallback)
  private getDefaultConfig(): FormConfig {
    return {
      version: "1.0.0",
      metadata: {
        name: "Default Form Configuration",
        description: "Fallback configuration when blob is unavailable",
        lastUpdated: new Date().toISOString(),
      },
      fields: [
        {
          type: "short-text",
          label: "Short Text",
          icon: "📝",
          category: "input",
          description: "Single line text input",
          component: {
            component: "Input", // Your custom component
            propMapping: {
              value: "value",
              onChange: "onChange",
              placeholder: "placeholder",
              disabled: "disabled",
              required: "required",
            },
            defaultProps: {
              type: "text",
            },
          },
          defaultProperties: {
            placeholder: "Enter text",
            maxLength: 255,
          },
          validation: {
            maxLength: 255,
          },
        },
        {
          type: "long-text",
          label: "Long Text",
          icon: "📄",
          category: "input",
          description: "Multi-line text area",
          component: {
            component: "Textarea", // Your custom component
            propMapping: {
              value: "value",
              onChange: "onChange",
              placeholder: "placeholder",
              disabled: "disabled",
              rows: "rows",
            },
          },
          defaultProperties: {
            placeholder: "Enter detailed text",
            rows: 4,
            maxLength: 2000,
          },
          validation: {
            maxLength: 2000,
          },
        },
        {
          type: "file-upload",
          label: "File Upload",
          icon: "📎",
          category: "input",
          description: "File upload with 2MB limit",
          component: {
            component: "FileUpload", // Your custom component
            propMapping: {
              onFileSelect: "onChange", // Your component might use onFileSelect
              acceptedTypes: "accept",
              maxSize: "maxFileSize",
              disabled: "disabled",
            },
            defaultProps: {
              multiple: false,
            },
          },
          defaultProperties: {
            acceptedTypes: [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
            maxSize: 2097152, // 2MB
            multiple: false,
          },
          validation: {
            custom: "validateFileSize",
          },
        },
        {
          type: "date-picker",
          label: "Date Picker",
          icon: "📅",
          category: "input",
          description: "Date selection field",
          component: {
            component: "DatePicker", // Your custom component
            propMapping: {
              value: "selectedDate", // Your component might use selectedDate
              onChange: "onDateChange", // Your component might use onDateChange
              placeholder: "placeholder",
              disabled: "disabled",
            },
            defaultProps: {
              format: "MM/DD/YYYY",
            },
          },
          defaultProperties: {
            dateFormat: "MM/DD/YYYY",
            placeholder: "Select a date",
          },
        },
        {
          type: "dropdown",
          label: "Dropdown",
          icon: "📋",
          category: "input",
          description: "Single or multiple choice selection",
          component: {
            component: "Select", // Your custom component
            propMapping: {
              value: "value",
              onChange: "onChange",
              options: "options",
              placeholder: "placeholder",
              disabled: "disabled",
              multiple: "multiple",
            },
          },
          defaultProperties: {
            options: [{ id: "1", label: "Option 1", value: "option1" }],
            selectionType: "single",
            placeholder: "Select an option",
          },
        },
        {
          type: "number",
          label: "Number",
          icon: "🔢",
          category: "input",
          description: "Numeric input field",
          component: {
            component: "NumberInput", // Your custom component
            propMapping: {
              value: "value",
              onChange: "onChange",
              placeholder: "placeholder",
              min: "min",
              max: "max",
              step: "step",
              disabled: "disabled",
            },
          },
          defaultProperties: {
            placeholder: "Enter a number",
            min: 0,
            step: 1,
          },
          validation: {
            pattern: "^[0-9]+$",
          },
        },
        // UDF Fields
        {
          type: "udf-designation",
          label: "Designation",
          icon: "💼",
          category: "udf",
          description: "User's job title",
          component: {
            component: "Input",
            propMapping: {
              value: "value",
              disabled: "disabled",
              placeholder: "placeholder",
            },
            defaultProps: {
              disabled: true,
            },
          },
          defaultProperties: {
            placeholder: "Auto-filled from user data",
          },
        },
        {
          type: "udf-department",
          label: "Department",
          icon: "🏢",
          category: "udf",
          description: "User's department",
          component: {
            component: "Input",
            propMapping: {
              value: "value",
              disabled: "disabled",
              placeholder: "placeholder",
            },
            defaultProps: {
              disabled: true,
            },
          },
          defaultProperties: {
            placeholder: "Auto-filled from user data",
          },
        },
        {
          type: "udf-location",
          label: "Location",
          icon: "📍",
          category: "udf",
          description: "User's location",
          component: {
            component: "Input",
            propMapping: {
              value: "value",
              disabled: "disabled",
              placeholder: "placeholder",
            },
            defaultProps: {
              disabled: true,
            },
          },
          defaultProperties: {
            placeholder: "Auto-filled from user data",
          },
        },
        {
          type: "udf-blood-group",
          label: "Blood Group",
          icon: "🩸",
          category: "udf",
          description: "User's blood group",
          component: {
            component: "Input",
            propMapping: {
              value: "value",
              disabled: "disabled",
              placeholder: "placeholder",
            },
            defaultProps: {
              disabled: true,
            },
          },
          defaultProperties: {
            placeholder: "Auto-filled from user data",
          },
        },
        {
          type: "udf-education",
          label: "Education",
          icon: "🎓",
          category: "udf",
          description: "User's education level",
          component: {
            component: "Input",
            propMapping: {
              value: "value",
              disabled: "disabled",
              placeholder: "placeholder",
            },
            defaultProps: {
              disabled: true,
            },
          },
          defaultProperties: {
            placeholder: "Auto-filled from user data",
          },
        },
      ],
    };
  }

  // Load configuration from blob URL
  async loadFromBlob(blobUrl: string): Promise<FormConfig> {
    if (this.isLoading) {
      // Wait for current loading to complete
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.config || this.getFallbackConfig();
    }

    this.isLoading = true;

    try {
      console.log(`Loading form configuration from: ${blobUrl}`);

      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const configData = await response.json();

      // Validate configuration structure
      if (!this.validateConfig(configData)) {
        throw new Error("Invalid configuration structure");
      }

      this.config = configData;
      console.log("✅ Configuration loaded successfully from blob");
      return this.config;
    } catch (error) {
      console.warn("⚠️ Failed to load configuration from blob:", error);
      console.log("🔄 Falling back to default configuration");
      return this.getFallbackConfig();
    } finally {
      this.isLoading = false;
    }
  }

  // Load from environment variable or default
  async loadConfig(): Promise<FormConfig> {
    const blobUrl =
      process.env.REACT_APP_FORM_CONFIG_URL || process.env.VITE_FORM_CONFIG_URL;

    if (blobUrl) {
      return this.loadFromBlob(blobUrl);
    } else {
      console.log("📋 No blob URL configured, using default configuration");
      return this.getFallbackConfig();
    }
  }

  // Get current configuration (cached)
  getConfig(): FormConfig {
    return this.config || this.getFallbackConfig();
  }

  // Get fallback configuration
  getFallbackConfig(): FormConfig {
    if (!this.fallbackConfig) {
      this.fallbackConfig = this.getDefaultConfig();
    }
    return this.fallbackConfig;
  }

  // Validate configuration structure
  private validateConfig(config: any): config is FormConfig {
    if (!config || typeof config !== "object") return false;
    if (!config.version || !Array.isArray(config.fields)) return false;

    // Validate each field definition
    for (const field of config.fields) {
      if (!field.type || !field.label || !field.component) return false;
      if (!field.component.component || !field.component.propMapping)
        return false;
    }

    return true;
  }

  // Get field definition by type
  getFieldDefinition(type: string): FieldDefinition | null {
    const config = this.getConfig();
    return config.fields.find((field) => field.type === type) || null;
  }

  // Get all fields by category
  getFieldsByCategory(category: string): FieldDefinition[] {
    const config = this.getConfig();
    return config.fields.filter((field) => field.category === category);
  }

  // Get all field types
  getAllFieldTypes(): string[] {
    const config = this.getConfig();
    return config.fields.map((field) => field.type);
  }

  // Refresh configuration (re-load from blob)
  async refreshConfig(): Promise<FormConfig> {
    this.config = null;
    return this.loadConfig();
  }

  // Check if configuration is loaded from blob
  isLoadedFromBlob(): boolean {
    return this.config !== null && this.config !== this.fallbackConfig;
  }
}

// Global configuration service instance
export const configService = new ConfigService();

// Convenience functions
export const loadFormConfig = () => configService.loadConfig();
export const getFormConfig = () => configService.getConfig();
export const getFieldDefinition = (type: string) =>
  configService.getFieldDefinition(type);
export const getFieldsByCategory = (category: string) =>
  configService.getFieldsByCategory(category);
export const refreshFormConfig = () => configService.refreshConfig();
