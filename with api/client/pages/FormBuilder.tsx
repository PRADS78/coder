import { useState } from "react";
import { FormBuilder as FormBuilderComponent } from "@/components/form-builder/FormBuilder";
import { FormSchema } from "@/lib/form-schema";

export default function FormBuilder() {
  const [savedForms, setSavedForms] = useState<FormSchema[]>([]);

  const handleSave = (schema: FormSchema) => {
    // In a real app, this would save to a backend
    console.log("Saving form:", schema);

    // Update local storage or state
    const existingIndex = savedForms.findIndex((form) => form.id === schema.id);
    if (existingIndex >= 0) {
      const updatedForms = [...savedForms];
      updatedForms[existingIndex] = schema;
      setSavedForms(updatedForms);
    } else {
      setSavedForms((prev) => [...prev, schema]);
    }

    // Show success message
    alert("Form saved successfully!");
  };

  const handlePublish = (schema: FormSchema) => {
    // In a real app, this would publish to a backend
    console.log("Publishing form:", schema);

    // Save the form first
    handleSave(schema);

    // Show success message with shareable link
    alert(
      "Form published successfully! You can now share this form with others.",
    );
  };

  return <FormBuilderComponent onSave={handleSave} onPublish={handlePublish} />;
}
