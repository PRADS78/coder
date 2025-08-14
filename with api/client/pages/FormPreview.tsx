import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormRenderer } from "@/components/form-builder/FormRenderer";
import {
  FormSchema,
  createDefaultForm,
  createDefaultField,
  generateId,
} from "@/lib/form-schema";
import { ValidationResult } from "@/lib/form-validation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function FormPreview() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);

  useEffect(() => {
    // Create demo form with the new structure
    const demoForm = createDefaultForm();
    demoForm.title = "Course Feedback Form";
    demoForm.description =
      "Help us improve! Share your feedback on your learning experience.";

    // Add some demo fields directly and in sections
    const field1 = {
      ...createDefaultField("short-text"),
      id: generateId(),
      order: 0,
    };
    field1.label = "Which module topic was the most useful?";
    field1.description =
      "Enter the name of the topic or share your learning insights.";

    const field2 = {
      ...createDefaultField("long-text"),
      id: generateId(),
      order: 1,
    };
    field2.label = "Suggest any content improvements";
    field2.description =
      "Provide detailed feedback on specific areas for improvement.";

    // Add them to the form
    demoForm.items = [field1, field2];

    setSchema(demoForm);
  }, [formId]);

  const handleSubmit = (
    values: Record<string, any>,
    validation: ValidationResult,
  ) => {
    if (validation.isValid) {
      console.log("Form Schema:", JSON.stringify(schema, null, 2));
      console.log("Form submitted:", values);
      setSubmissionData(values);
      setSubmitted(true);
    } else {
      console.log("Form validation failed:", validation.errors);
    }
  };

  const handleBackToBuilder = () => {
    navigate("/form-builder");
  };

  if (!schema) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You!
            </h1>
            <p className="text-gray-600 mb-6">
              Your response has been submitted successfully.
            </p>
            <Button onClick={handleBackToBuilder} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Form Builder
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBackToBuilder}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Builder
          </Button>
          <div className="text-sm text-gray-500">Form Preview</div>
        </div>
      </div>

      <div className="py-8">
        <FormRenderer schema={schema} onSubmit={handleSubmit} mode="response" />
      </div>
    </div>
  );
}
