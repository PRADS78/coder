# 🚀 Dynamic Form Builder Setup Guide

## 📋 Overview

The form builder now supports **completely dynamic field configuration** from external JSON blobs. You can add/remove field types without any code changes!

## 🏗️ Architecture

### 1. Configuration Service (`config-service.ts`)

- Loads field definitions from blob URL or uses fallback
- Handles prop mapping for your custom components
- Zero-code field management

### 2. Component Registry (`component-registry.ts`)

- Maps field types to your custom components
- Handles different prop names automatically
- Graceful fallbacks for missing components

### 3. Dynamic Components

- `DynamicFormRenderer.tsx` - Form renderer using dynamic config
- `DynamicFieldsSidebar.tsx` - Fields sidebar from config

## ⚙️ Setup Instructions

### Step 1: Register Your Custom Components

```typescript
// In your App.tsx or main.tsx
import { registerCustomComponents } from "@/lib/component-registry";

// Import your custom components
import { MyInput } from "@/components/MyInput";
import { MyTextarea } from "@/components/MyTextarea";
import { MyFileUpload } from "@/components/MyFileUpload";
import { MyDatePicker } from "@/components/MyDatePicker";

// Register them once at app startup
registerCustomComponents({
  Input: MyInput,
  Textarea: MyTextarea,
  FileUpload: MyFileUpload,
  DatePicker: MyDatePicker,
  Select: MySelect,
  NumberInput: MyNumberInput,
});
```

### Step 2: Set Blob URL (Optional)

```bash
# In your .env file
REACT_APP_FORM_CONFIG_URL=https://your-blob-storage.com/form-config.json
# or for Vite:
VITE_FORM_CONFIG_URL=https://your-blob-storage.com/form-config.json
```

### Step 3: Use Dynamic Components

```typescript
// Replace old components with dynamic ones
import { DynamicFormRenderer } from '@/components/form-builder/DynamicFormRenderer';
import { DynamicFieldsSidebar } from '@/components/form-builder/DynamicFieldsSidebar';

// Use exactly like before - no other changes needed!
<DynamicFormRenderer schema={schema} onSubmit={handleSubmit} />
<DynamicFieldsSidebar onFieldAdd={handleFieldAdd} />
```

## 📝 Configuration JSON Structure

Create a JSON file with this structure:

```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "My Form Configuration",
    "description": "Dynamic field definitions",
    "lastUpdated": "2024-01-15T10:00:00Z"
  },
  "fields": [
    {
      "type": "email",
      "label": "Email Address",
      "icon": "📧",
      "category": "input",
      "description": "Email input with validation",
      "component": {
        "component": "EmailInput",
        "propMapping": {
          "value": "emailValue",
          "onChange": "onEmailChange",
          "placeholder": "placeholder",
          "disabled": "disabled"
        }
      },
      "defaultProperties": {
        "placeholder": "Enter email address"
      },
      "validation": {
        "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
      }
    }
  ]
}
```

## 🔧 Prop Mapping Examples

### Your Component Has Different Prop Names?

```json
{
  "component": {
    "component": "MyCustomInput",
    "propMapping": {
      "value": "inputValue", // Standard -> Your prop name
      "onChange": "onValueChange", // Standard -> Your prop name
      "placeholder": "hintText", // Standard -> Your prop name
      "disabled": "isDisabled" // Standard -> Your prop name
    },
    "defaultProps": {
      "variant": "outlined", // Always passed to your component
      "size": "medium"
    }
  }
}
```

### File Upload with Custom Props

```json
{
  "component": {
    "component": "MyFileUpload",
    "propMapping": {
      "onFileSelect": "onChange",
      "acceptedTypes": "allowedExtensions",
      "maxSize": "maxFileSize",
      "disabled": "isDisabled"
    },
    "defaultProps": {
      "uploadMode": "single",
      "showPreview": true
    }
  }
}
```

### Date Picker with Custom Props

```json
{
  "component": {
    "component": "MyDatePicker",
    "propMapping": {
      "value": "selectedDate",
      "onChange": "onDateSelect",
      "placeholder": "placeholderText",
      "disabled": "isReadOnly"
    },
    "defaultProps": {
      "format": "MM/DD/YYYY",
      "showCalendarIcon": true
    }
  }
}
```

## 🎯 Adding New Fields (Zero Code!)

### Method 1: Update JSON Blob

1. Add new field definition to your JSON config
2. Upload to blob storage
3. Refresh the form builder - new field appears!

### Method 2: Fallback Configuration

If you don't want to use blob storage, update `config-service.ts`:

```typescript
// Add to getDefaultConfig() method
{
  "type": "signature",
  "label": "Digital Signature",
  "icon": "✍️",
  "category": "input",
  "component": {
    "component": "SignaturePad",
    "propMapping": {
      "value": "signatureData",
      "onChange": "onSignatureChange"
    }
  }
}
```

## 🔍 How It Works

### 1. Field Loading

```typescript
// Configuration loads from blob URL or fallback
const config = await loadFormConfig();

// Fields are dynamically registered
const fields = getFieldsByCategory("input");
```

### 2. Dynamic Rendering

```typescript
// Component is resolved from registry
const Component = componentRegistry.getComponent(fieldDef.component.component);

// Props are mapped automatically
const mappedProps = mapProps(fieldDef.component, standardProps);

// Rendered dynamically
return React.createElement(Component, mappedProps);
```

### 3. Graceful Fallbacks

- Missing components → Fallback components used
- Invalid config → Default configuration used
- Network error → Local fallback used

## 🚨 Important Notes

### Component Registration

- Register components **once** at app startup
- Use exact names from JSON config
- Components must accept the mapped props

### Prop Mapping

- `propMapping` maps standard props to your component props
- `defaultProps` are always passed to your component
- Unmapped props are passed through automatically

### Field Types

- Field `type` must be unique across all fields
- Used for drag-and-drop and form rendering
- Can be any string (e.g., "email", "signature", "rating")

## 🎉 Benefits

✅ **Zero Code Changes** - Add fields by updating JSON only
✅ **Your Components** - Use your existing components with any prop names  
✅ **Graceful Fallbacks** - Works even if blob/components are missing
✅ **Hot Reload** - Changes appear immediately without rebuilds
✅ **Type Safe** - Full TypeScript support with validation
✅ **Backward Compatible** - Existing forms continue to work

## 🔧 Troubleshooting

### Component Not Found

```
⚠️ Component not found: MyCustomInput
```

**Solution**: Register the component in your app initialization

### Invalid Configuration

```
❌ Invalid configuration structure
```

**Solution**: Check JSON structure matches the schema

### Blob Loading Failed

```
⚠️ Failed to load configuration from blob
🔄 Falling back to default configuration
```

**Solution**: Check blob URL and network connectivity. App continues with fallback.

## 📚 Examples

See `client/docs/example-config.json` for a complete configuration example with:

- Different component prop mappings
- Custom validation rules
- Multiple field categories
- Real-world field types

The system is now **completely dynamic** - update the JSON to add/remove any field type without touching code! 🎯
